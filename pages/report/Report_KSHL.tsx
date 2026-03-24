import AdminLayout from '@/components/AdminLayout'
import React, { useState, useRef } from 'react'
import { Button, Toast } from '@/components/prime'
import { FeedbackFilters } from '@/components/feedbacks/FeedbackFilters'
import { formatDateVN, getDefaultDates } from '@/utils/dateUtils'
import { exportKSHLToWord } from '@/utils/wordExportKSHL'
import { exportKSHLToPDF } from '@/utils/pdfExportKSHL'

const Report_KSHL = () => {
    const toast = useRef<Toast>(null);
    const [loading, setLoading] = useState(false);

    // Bộ lọc
    const [filterType, setFilterType] = useState('this_year');
    const [dateFilter, setDateFilter] = useState(getDefaultDates());

    const handleFilterChange = (newType: string) => {
        setFilterType(newType);
        const now = new Date();
        const year = now.getFullYear();
        const formatDateStr = (date: Date) => {
            const y = date.getFullYear();
            const m = String(date.getMonth() + 1).padStart(2, '0');
            const d = String(date.getDate()).padStart(2, '0');
            return `${y}-${m}-${d}`;
        };

        let start = new Date();
        let end = new Date();

        if (newType === 'this_month') {
            start = new Date(year, now.getMonth(), 1);
            end = new Date(year, now.getMonth() + 1, 0);
        } else if (newType === 'last_month') {
            start = new Date(year, now.getMonth() - 1, 1);
            end = new Date(year, now.getMonth(), 0);
        } else if (newType === 'first_half') {
            start = new Date(year, 0, 1);
            end = new Date(year, 5, 30);
        } else if (newType === 'this_year') {
            start = new Date(year, now.getMonth() - 11, 1);
            end = new Date(year, now.getMonth() + 1, 0);
        } else if (newType === 'second_half') {
            start = new Date(year, 6, 1);
            end = new Date(year, 11, 31);
        } else if (newType === 'custom') {
            return;
        }

        setDateFilter({
            startDate: formatDateStr(start),
            endDate: formatDateStr(end)
        });
    };

    const handleCustomDateChange = (date: Date | null, field: 'startDate' | 'endDate') => {
        if (date) {
            const y = date.getFullYear();
            const m = String(date.getMonth() + 1).padStart(2, '0');
            const d = String(date.getDate()).padStart(2, '0');
            setDateFilter(prev => ({ ...prev, [field]: `${y}-${m}-${d}` }));
        }
    };

    // --- DỮ LIỆU TỔNG HỢP (8 CỘT) ---
    const dataNgoaiTru = [
        { id: '1', type: 'BV công lập', col1: '38/43', col2: '2.627', col3: '95.53', col4: '19/43', col5: '608', col6: '88.91' },
        { id: '2', type: 'BV ngoài công lập', col1: '37/46', col2: '2.631', col3: '98.74', col4: '5/46', col5: '187', col6: '93.08' },
        { id: '3', type: 'Trạm Y tế', col1: '95/126', col2: '3.656', col3: '97.2', col4: '32/126', col5: '182', col6: '83.39' },
        { id: '4', type: 'Không ghi địa chỉ', col1: '', col2: '', col3: '', col4: '', col5: '22', col6: '85.97' },
        { id: '', type: 'Tổng', col1: '170/215', col2: '8.914', col3: '97.16', col4: '56/215', col5: '999', col6: '88.46', isTotal: true },
    ];

    const dataNoiTru = [
        { id: '1', type: 'BV công lập', col1: '36/43', col2: '2.319', col3: '93.75', col4: '20/43', col5: '416', col6: '85.24' },
        { id: '2', type: 'BV ngoài công lập', col1: '36/46', col2: '1.991', col3: '99.22', col4: '6/46', col5: '130', col6: '75.1' },
        { id: '', type: 'Tổng', col1: '72/89', col2: '4.310', col3: '96.49', col4: '26/89', col5: '546', col6: '80.17', isTotal: true },
    ];

    const dataTiemChung = [
        { id: '1', type: 'Khối Bệnh viện', col1: '', col2: '', col3: '', col4: '4', col5: '30', col6: '84.5' },
        { id: '2', type: 'Khối TYT', col1: '86/126', col2: '2.534', col3: '97.23', col4: '20', col5: '154', col6: '82.4' },
        { id: '', type: 'Không ghi địa chỉ', col1: '', col2: '', col3: '', col4: '', col5: '155', col6: '85.97' },
        { id: '', type: 'Tổng', col1: '86/126', col2: '2.534', col3: '97.23', col4: '24', col5: '339', col6: '84.29', isTotal: true },
    ];

    // --- DỮ LIỆU PHỤ LỤC CHI TIẾT (10 CỘT) ---
    const dataPhuLuc1 = [
        { id: '1', type: 'BV Xanh Pôn', col1: '98.2', col2: '93.3', col3: '60', col4: '65', col5: '', col6: '', col7: '', col8: '' },
        { id: '2', type: 'BV Tim Hà Nội (1,2)', col1: '100', col2: '94.4', col3: '55', col4: '87', col5: '', col6: '', col7: '', col8: '' },
        { id: '3', type: 'BV Thanh Nhàn', col1: '99.36', col2: '96.88', col3: '175', col4: '174', col5: '82', col6: '89.68', col7: '56', col8: '2' },
        { id: '4', type: 'BV Đức Giang', col1: '100', col2: '96.36', col3: '48', col4: '55', col5: '80', col6: '85.11', col7: '1', col8: '13' },
        { id: '5', type: 'BV đa khoa Hà Đông', col1: '96.8', col2: '96.65', col3: '150', col4: '200', col5: '78.6', col6: '', col7: '8', col8: '' },
    ];

    const dataPhuLuc2 = [
        { id: '1', type: 'BV Hồng Ngọc', col1: '99', col2: '99.5', col3: '104', col4: '89', col5: '', col6: '', col7: '', col8: '' },
        { id: '2', type: 'BV đa khoa Medlatec', col1: '99.87', col2: '98.59', col3: '45', col4: '94', col5: '', col6: '', col7: '', col8: '' },
        { id: '3', type: 'BV QT VINMEC', col1: '100', col2: '100', col3: '47', col4: '136', col5: '98.4', col6: '98.46', col7: '38', col8: '87' },
        { id: '4', type: 'BV Thu Cúc', col1: '98.17', col2: '97.97', col3: '50', col4: '100', col5: '', col6: '', col7: '', col8: '' },
        { id: '5', type: 'BV Việt Pháp Hà Nội', col1: '100', col2: '100', col3: '118', col4: '100', col5: '', col6: '', col7: '', col8: '' },
    ];

    const dataPhuLuc3 = [
        { id: '1', type: 'Cửa Nam', col1: '98', col2: '87', col3: '35', col4: '50', col5: '', col6: '', col7: '', col8: '' },
        { id: '2', type: 'Ba Đình', col1: '98.6', col2: '98', col3: '25', col4: '45', col5: '', col6: '', col7: '', col8: '' },
        { id: '3', type: 'Ngọc Hà', col1: '98.7', col2: '98.7', col3: '10', col4: '7', col5: '91.4', col6: '82.58', col7: '6', col8: '2' },
        { id: '4', type: 'Giảng Võ', col1: '100', col2: '100', col3: '10', col4: '15', col5: '', col6: '', col7: '', col8: '' },
        { id: '5', type: 'Hai Bà Trưng', col1: '', col2: '95.4', col3: '', col4: '52', col5: '', col6: '', col7: '', col8: '' },
    ];

    const headerTongHop = ['TS đơn vị báo cáo', 'Tổng số phiếu KS hài lòng', 'Tỷ lệ hài lòng', 'TS đơn vị báo cáo', 'Tổng số phiếu KS hài lòng', 'Tỷ lệ hài lòng'];

    const handleExportPDF = async () => {
        await exportKSHLToPDF(
            {
                dataNgoaiTru,
                dataNoiTru,
                dataTiemChung,
                dataPhuLuc1,
                dataPhuLuc2,
                dataPhuLuc3,
            },
            dateFilter,
            setLoading,
            (msg) => toast.current?.show({ severity: 'success', summary: 'Thành công', detail: msg }),
            (msg) => toast.current?.show({ severity: 'error', summary: 'Lỗi', detail: msg })
        );
    };

    const handleExportWord = async () => {
        await exportKSHLToWord(
            {
                dataNgoaiTru,
                dataNoiTru,
                dataTiemChung,
                dataPhuLuc1,
                dataPhuLuc2,
                dataPhuLuc3,
            },
            dateFilter,
            setLoading,
            (msg) => toast.current?.show({ severity: 'success', summary: 'Thành công', detail: msg }),
            (msg) => toast.current?.show({ severity: 'error', summary: 'Lỗi', detail: msg })
        );
    };

    // Component hỗ trợ render bảng động trên Web UI
    const TablePreview = ({ title, data, isAppendix = false, type1 = '', type2 = '', unitLabel = 'Đơn vị' }: any) => (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 mt-6 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-white">
                <h3 className={`font-bold text-slate-800 text-lg tracking-tight ${isAppendix ? 'text-center' : ''}`}>{title}</h3>
            </div>
            <div className="overflow-x-auto p-4 md:p-6 bg-slate-50">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <table className="w-full text-sm text-left border-collapse border border-slate-300">
                        <thead className="bg-primary-900 text-white uppercase text-xs">
                            {!isAppendix ? (
                                <>
                                    <tr>
                                        <th rowSpan={2} className="border border-slate-600 p-3 text-center align-middle font-semibold w-12">STT</th>
                                        <th rowSpan={2} className="border border-slate-600 p-3 align-middle font-semibold whitespace-nowrap">{unitLabel}</th>
                                        <th colSpan={3} className="border border-slate-600 p-3 text-center font-semibold">KQ tự khảo sát</th>
                                        <th colSpan={3} className="border border-slate-600 p-3 text-center font-semibold">KQ qua QR của SYT</th>
                                    </tr>
                                    <tr>
                                        {headerTongHop.map((header, idx) => (
                                            <th key={idx} className="border border-slate-600 p-3 text-center font-semibold whitespace-nowrap">{header}</th>
                                        ))}
                                    </tr>
                                </>
                            ) : (
                                <>
                                    <tr>
                                        <th rowSpan={3} className="border border-slate-600 p-3 text-center align-middle font-semibold w-12">STT</th>
                                        <th rowSpan={3} className="border border-slate-600 p-3 align-middle font-semibold whitespace-nowrap">{unitLabel}</th>
                                        <th colSpan={4} className="border border-slate-600 p-3 text-center font-semibold">KQ tự khảo sát của đơn vị</th>
                                        <th colSpan={4} className="border border-slate-600 p-3 text-center font-semibold">KQ khảo sát qua QR của SYT</th>
                                    </tr>
                                    <tr>
                                        <th rowSpan={2} className="border border-slate-600 p-2 text-center align-middle font-semibold leading-tight">CSHL<br />{type1}</th>
                                        <th rowSpan={2} className="border border-slate-600 p-2 text-center align-middle font-semibold leading-tight">CSHL<br />{type2}</th>
                                        <th colSpan={2} className="border border-slate-600 p-2 text-center font-semibold">TS phiếu KS</th>
                                        <th rowSpan={2} className="border border-slate-600 p-2 text-center align-middle font-semibold leading-tight">CSHL<br />{type1}</th>
                                        <th rowSpan={2} className="border border-slate-600 p-2 text-center align-middle font-semibold leading-tight">CSHL<br />{type2}</th>
                                        <th colSpan={2} className="border border-slate-600 p-2 text-center font-semibold">TS phiếu KS</th>
                                    </tr>
                                    <tr>
                                        <th className="border border-slate-600 p-2 text-center font-semibold whitespace-nowrap">{type1}</th>
                                        <th className="border border-slate-600 p-2 text-center font-semibold whitespace-nowrap">{type2}</th>
                                        <th className="border border-slate-600 p-2 text-center font-semibold whitespace-nowrap">{type1}</th>
                                        <th className="border border-slate-600 p-2 text-center font-semibold whitespace-nowrap">{type2}</th>
                                    </tr>
                                </>
                            )}
                        </thead>
                        <tbody>
                            {data.map((row: any, index: number) => (
                                <tr key={index} className={`hover:bg-slate-50 border-b border-slate-200 transition-colors ${row.isTotal ? 'font-bold bg-primary-50/50 text-primary-900 border-t-2 border-t-primary-200' : ''}`}>
                                    <td className="border border-slate-300 p-3 text-center font-medium">{row.id}</td>
                                    <td className="border border-slate-300 p-3 whitespace-nowrap text-slate-800">{row.type}</td>
                                    <td className="border border-slate-300 p-3 text-center text-slate-700">{row.col1}</td>
                                    <td className="border border-slate-300 p-3 text-center text-slate-700">{row.col2}</td>
                                    <td className="border border-slate-300 p-3 text-center text-slate-700">{row.col3}</td>
                                    <td className="border border-slate-300 p-3 text-center text-slate-700">{row.col4}</td>
                                    <td className="border border-slate-300 p-3 text-center text-slate-700">{row.col5}</td>
                                    <td className="border border-slate-300 p-3 text-center text-slate-700">{row.col6}</td>
                                    {isAppendix && <td className="border border-slate-300 p-3 text-center text-slate-700">{row.col7}</td>}
                                    {isAppendix && <td className="border border-slate-300 p-3 text-center text-slate-700">{row.col8}</td>}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );

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
                    label="Xuất Word"
                    icon="pi pi-file-word"
                    className="bg-gradient-to-br from-blue-500 to-blue-700 border-none rounded-2xl font-bold shadow-lg shadow-blue-200/50 hover:shadow-blue-300/60 hover:scale-105 active:translate-y-0 active:scale-95 transition-all duration-300 text-white px-6 py-2.5 flex items-center gap-2"
                    onClick={handleExportWord}
                    disabled={loading}
                    loading={loading}
                />
                <Button
                    label="Xuất PDF"
                    icon="pi pi-file-pdf"
                    className="bg-gradient-to-br from-primary-500 to-primary-700 border-none rounded-2xl font-bold shadow-lg shadow-primary-200/50 hover:shadow-primary-300/60 hover:scale-105 active:translate-y-0 active:scale-95 transition-all duration-300 text-white px-6 py-2.5 flex items-center gap-2"
                    onClick={handleExportPDF}
                    disabled={loading}
                    loading={loading}
                />
            </div>
        </div>
    );

    return (
        <AdminLayout title="Báo cáo Khảo sát hài lòng" subtitle="">
            <Toast ref={toast} />
            <div className="space-y-6 pb-10">
                <FeedbackFilters filterType={filterType} handleFilterChange={handleFilterChange} dateFilter={dateFilter} handleCustomDateChange={handleCustomDateChange} reportHeader={reportHeader} />

                {/* Bảng Tổng hợp */}
                <TablePreview title="1. Kết quả người bệnh ngoại trú" data={dataNgoaiTru} />
                <TablePreview title="2. Kết quả người bệnh nội trú" data={dataNoiTru} />
                <TablePreview title="3. Kết quả người dân sử dụng dịch vụ tiêm chủng" data={dataTiemChung} />

                <hr className="my-8 border-slate-200" />

                {/* Bảng Phụ lục */}
                <TablePreview title="Phụ lục 1: Kết quả khảo sát hài lòng của các Bệnh viện công lập" data={dataPhuLuc1} isAppendix={true} type1="nội trú" type2="ngoại trú" unitLabel="Tên bệnh viện" />
                <TablePreview title="Phụ lục 2: Kết quả khảo sát hài lòng của các Bệnh viện ngoài công lập" data={dataPhuLuc2} isAppendix={true} type1="nội trú" type2="ngoại trú" unitLabel="Tên bệnh viện" />
                <TablePreview title="Phụ lục 3: Kết quả khảo sát hài lòng của các Trạm Y tế" data={dataPhuLuc3} isAppendix={true} type1="tiêm chủng" type2="ngoại trú" unitLabel="Xã / Phường" />
            </div>
        </AdminLayout>
    )
}

export default Report_KSHL;