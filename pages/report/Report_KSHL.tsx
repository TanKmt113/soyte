import AdminLayout from '@/components/AdminLayout'
import React, { useState, useRef } from 'react'
import { Button, Toast } from '@/components/prime'
import { FeedbackFilters } from '@/components/feedbacks/FeedbackFilters'
import { TablePreview } from '@/components/report/TablePreview'
import { formatDateVN, getDefaultDates } from '@/utils/dateUtils'
import { exportKSHLToWord } from '@/utils/wordExportKSHL'
import { exportKSHLToPDF } from '@/utils/pdfExportKSHL'
import { useKSHLData } from '@/hooks/useKSHLData'

const Report_KSHL = () => {
    const toast = useRef<Toast>(null);

    // --- Bộ lọc ngày ---
    const [filterType, setFilterType] = useState('this_year');
    const [dateFilter, setDateFilter] = useState(getDefaultDates());

    const handleFilterChange = (newType: string) => {
        setFilterType(newType);
        const now = new Date();
        const year = now.getFullYear();
        const fmt = (date: Date) => {
            const y = date.getFullYear();
            const m = String(date.getMonth() + 1).padStart(2, '0');
            const d = String(date.getDate()).padStart(2, '0');
            return `${y}-${m}-${d}`;
        };

        let start = new Date(), end = new Date();
        if (newType === 'this_month') { start = new Date(year, now.getMonth(), 1); end = new Date(year, now.getMonth() + 1, 0); }
        else if (newType === 'last_month') { start = new Date(year, now.getMonth() - 1, 1); end = new Date(year, now.getMonth(), 0); }
        else if (newType === 'first_half') { start = new Date(year, 0, 1); end = new Date(year, 5, 30); }
        else if (newType === 'this_year') { start = new Date(year, now.getMonth() - 11, 1); end = new Date(year, now.getMonth() + 1, 0); }
        else if (newType === 'second_half') { start = new Date(year, 6, 1); end = new Date(year, 11, 31); }
        else if (newType === 'custom') return;

        setDateFilter({ startDate: fmt(start), endDate: fmt(end) });
    };

    const handleCustomDateChange = (date: Date | null, field: 'startDate' | 'endDate') => {
        if (date) {
            const y = date.getFullYear();
            const m = String(date.getMonth() + 1).padStart(2, '0');
            const d = String(date.getDate()).padStart(2, '0');
            setDateFilter(prev => ({ ...prev, [field]: `${y}-${m}-${d}` }));
        }
    };

    // --- Trạng thái ẩn/hiện bảng ---
    const [expandedTables, setExpandedTables] = useState<Record<string, boolean>>({
        ngoaiTru: true, noiTru: true, tiemChung: true,
        phuLuc1: true, phuLuc2: true, phuLuc3: true
    });
    const toggleTable = (key: string) => setExpandedTables(prev => ({ ...prev, [key]: !prev[key] }));

    // --- Dữ liệu từ hook ---
    const { processedData, loading, setLoading } = useKSHLData(dateFilter);
    const { dataNgoaiTru, dataNoiTru, dataTiemChung, dataPhuLuc1, dataPhuLuc2, dataPhuLuc3 } = processedData;

    // --- Xuất file ---
    const exportPayload = { dataNgoaiTru, dataNoiTru, dataTiemChung, dataPhuLuc1, dataPhuLuc2, dataPhuLuc3 };

    const handleExportPDF = async () => {
        await exportKSHLToPDF(
            exportPayload, dateFilter, setLoading,
            (msg) => toast.current?.show({ severity: 'success', summary: 'Thành công', detail: msg }),
            (msg) => toast.current?.show({ severity: 'error', summary: 'Lỗi', detail: msg })
        );
    };

    const handleExportWord = async () => {
        await exportKSHLToWord(
            exportPayload, dateFilter, setLoading,
            (msg) => toast.current?.show({ severity: 'success', summary: 'Thành công', detail: msg }),
            (msg) => toast.current?.show({ severity: 'error', summary: 'Lỗi', detail: msg })
        );
    };

    const reportHeader = (
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center">
                <i className="pi pi-chart-bar text-primary-600 text-xl"></i>
            </div>
            <h2 className="text-lg md:text-xl font-bold text-slate-800 tracking-tight">
                Kết quả khảo sát từ ngày <span className="text-primary-700">{formatDateVN(dateFilter.startDate)}</span> đến ngày <span className="text-primary-700">{formatDateVN(dateFilter.endDate)}</span>
            </h2>
            <div className="flex items-center gap-2">
                <Button
                    label="Xuất Word" icon="pi pi-file-word"
                    className="bg-gradient-to-br from-blue-500 to-blue-700 border-none rounded-2xl font-bold shadow-lg shadow-blue-200/50 hover:shadow-blue-300/60 hover:scale-105 active:scale-95 transition-all duration-300 text-white px-6 py-2.5 flex items-center gap-2"
                    onClick={handleExportWord} disabled={loading} loading={loading}
                />
                <Button
                    label="Xuất PDF" icon="pi pi-file-pdf"
                    className="bg-gradient-to-br from-primary-500 to-primary-700 border-none rounded-2xl font-bold shadow-lg shadow-primary-200/50 hover:shadow-primary-300/60 hover:scale-105 active:scale-95 transition-all duration-300 text-white px-6 py-2.5 flex items-center gap-2"
                    onClick={handleExportPDF} disabled={loading} loading={loading}
                />
            </div>
        </div>
    );

    const tableProps = { expandedTables, toggleTable };

    return (
        <AdminLayout title="Báo cáo Khảo sát hài lòng" subtitle="">
            <Toast ref={toast} />
            <div className="space-y-6 pb-10">
                <FeedbackFilters filterType={filterType} handleFilterChange={handleFilterChange} dateFilter={dateFilter} handleCustomDateChange={handleCustomDateChange} reportHeader={reportHeader} />

                {/* Bảng Tổng hợp */}
                <TablePreview title="1. Kết quả người bệnh ngoại trú" data={dataNgoaiTru} tableKey="ngoaiTru" {...tableProps} />
                <TablePreview title="2. Kết quả người bệnh nội trú" data={dataNoiTru} tableKey="noiTru" {...tableProps} />
                <TablePreview title="3. Kết quả người dân sử dụng dịch vụ tiêm chủng" data={dataTiemChung} tableKey="tiemChung" {...tableProps} />

                <hr className="my-8 border-slate-200" />

                {/* Bảng Phụ lục */}
                <TablePreview title="Phụ lục 1: Kết quả khảo sát hài lòng của các Bệnh viện công lập" data={dataPhuLuc1} isAppendix type1="nội trú" type2="ngoại trú" unitLabel="Tên bệnh viện" tableKey="phuLuc1" {...tableProps} />
                <TablePreview title="Phụ lục 2: Kết quả khảo sát hài lòng của các Bệnh viện ngoài công lập" data={dataPhuLuc2} isAppendix type1="nội trú" type2="ngoại trú" unitLabel="Tên bệnh viện" tableKey="phuLuc2" {...tableProps} />
                <TablePreview title="Phụ lục 3: Kết quả khảo sát hài lòng của các Trạm Y tế" data={dataPhuLuc3} isAppendix type1="tiêm chủng" type2="ngoại trú" unitLabel="Xã / Phường" tableKey="phuLuc3" {...tableProps} />
            </div>
        </AdminLayout>
    );
}

export default Report_KSHL;