import AdminLayout from '@/components/AdminLayout'
import React, { useState, useEffect, useRef, useMemo } from 'react'

import { FeedbackFilters } from '@/components/feedbacks/FeedbackFilters'
import { Toast } from '@/components/prime'
import { TabView, TabPanel } from 'primereact/tabview'
import { exportTCT01ToWord } from '@/utils/wordExportTCT01'
import { exportTCT01ToPDF } from '@/utils/pdfExportTCT01'
import { feedBacksSevice } from '@/services/feedBacksSevice'
import { formService } from '@/services/formService'
import { useFacilities } from '@/hooks/useFacilities'
import { FeedbackItem } from '@/types/feedbacks'
import { ReportAppendix } from '@/components/feedbacks/ReportAppendix'
import { TCT01TabContent } from '@/components/feedbacks/TCT01TabContent'
import { calculateTotalUnits, calculateOnTimeStats, formatRate } from '@/utils/reportDataUtils'
import { ReportHeader } from '@/components/feedbacks/ReportHeader'
import { ReportLoadingState, ReportEmptyState, StyledTabViewCSS } from '@/components/feedbacks/ReportStates'
import { useReportFilter } from '@/hooks/useReportFilter'

const Report_TCT01 = () => {
    const toast = useRef<Toast>(null);
    const { facilities } = useFacilities();
    const [loading, setLoading] = useState(false);
    const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
    const [formTemplates, setFormTemplates] = useState<Record<string, any>>({});
    const fetchedTemplatesRef = useRef<Set<string>>(new Set());
    const loadingTemplatesRef = useRef<Set<string>>(new Set());

    const { filterType, dateFilter, handleFilterChange, handleCustomDateChange } = useReportFilter();

    const fetchAllFeedbacks = async () => {
        try {
            setLoading(true);
            const response = await feedBacksSevice.fetchFeedBacksByType('reflect', dateFilter.startDate, dateFilter.endDate);
            const data = response.data || response;
            let list: any[] = [];

            if (data?.items && Array.isArray(data.items)) { list = data.items; }
            else if (data?.data?.items && Array.isArray(data.data.items)) { list = data.data.items; }
            else if (Array.isArray(data)) { list = data; }
            setFeedbacks(list);
        } catch (error) {
            console.error(error);
            toast.current?.show({ severity: 'error', summary: 'Lỗi', detail: 'Không thể tải danh sách phản hồi để báo cáo' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllFeedbacks();
    }, [dateFilter.startDate, dateFilter.endDate]);

    // Nhóm các phản hồi theo Biểu mẫu
    const groupedFeedbacks = useMemo<Record<string, { title: string, items: FeedbackItem[] }>>(() => {
        const groups: Record<string, { title: string, items: FeedbackItem[] }> = {
            '3': { title: "Khối các bệnh viện trực thuộc", items: [] },
            '17': { title: "Đơn vị trợ giúp xã hội trực thuộc", items: [] },
            '18': { title: "Khối các trạm y tế xã, phường", items: [] }
        };

        feedbacks.forEach(fb => {
            const fId = String(fb.form_id);
            if (groups[fId]) {
                groups[fId].items.push(fb);
            }
        });

        return groups;
    }, [feedbacks]);

    // Tải template
    useEffect(() => {
        const fetchTemplates = async () => {
            const formIds = Object.keys(groupedFeedbacks);

            for (const id of formIds) {
                if (!fetchedTemplatesRef.current.has(id) && !loadingTemplatesRef.current.has(id)) {
                    loadingTemplatesRef.current.add(id);
                    try {
                        const res = await formService.fetchFormById(id);
                        const tplData = res.data || res;
                        setFormTemplates(prev => ({ ...prev, [id]: tplData }));
                        fetchedTemplatesRef.current.add(id);
                    } catch (err) {
                        console.error(`Error fetching template ${id}:`, err);
                    } finally {
                        loadingTemplatesRef.current.delete(id);
                    }
                }
            }
        };

        if (Object.keys(groupedFeedbacks).length > 0) {
            fetchTemplates();
        }
    }, [groupedFeedbacks]);

    // Tính toán dữ liệu báo cáo từ feedbacks và templates
    const reportData = useMemo(() => {
        const data: any = {
            benhVien: { title: "Khối các bệnh viện trực thuộc", tongSo: 0, tiepNhan: [], deCuong: [] },
            troGiupXaHoi: { title: "Đơn vị trợ giúp xã hội trực thuộc", tongSo: 0, tiepNhan: [], deCuong: [] },
            tramYTe: { title: "Khối các trạm y tế xã, phường", tongSo: 0, tiepNhan: [], deCuong: [] },
            phuLuc: []
        };

        const categories = [
            { id: '3', key: 'benhVien', nhom: "Khối các bệnh viện trực thuộc" },
            { id: '17', key: 'troGiupXaHoi', nhom: "Các đơn vị trợ giúp xã hội trực thuộc" },
            { id: '18', key: 'tramYTe', nhom: "Khối các trạm y tế xã, phường" }
        ];

        categories.forEach(cat => {
            const group = groupedFeedbacks[cat.id];
            const items = group?.items || [];
            const template = formTemplates[cat.id];

            const totalUnits = calculateTotalUnits(template, facilities);
            const reportedCount = items.length;
            const notReportedCount = Math.max(0, totalUnits - reportedCount);
            const { onTimeCount, lateCount } = calculateOnTimeStats(items, template);

            data[cat.key] = {
                title: group?.title || cat.nhom,
                tongSo: totalUnits,
                tiepNhan: [
                    { stt: 1, noiDung: "Đơn vị báo cáo", soLuong: reportedCount, tyLe: formatRate(reportedCount, totalUnits) },
                    { stt: 2, noiDung: "Đơn vị không báo cáo", soLuong: notReportedCount, tyLe: formatRate(notReportedCount, totalUnits) }
                ],
                deCuong: [
                    { stt: 1, noiDung: "Đơn vị báo cáo đúng theo đề cương và biểu mẫu", soLuong: onTimeCount, tyLe: formatRate(onTimeCount, reportedCount) },
                    { stt: 2, noiDung: "Đơn vị báo cáo không đúng theo đề cương và biểu mẫu", soLuong: lateCount, tyLe: formatRate(lateCount, reportedCount) }
                ]
            };

            if (reportedCount > 0) {
                const facilityNames: string[] = items.map(fb => {
                    if (fb.info) {
                        const candidateKeys = Object.entries(fb.info)
                            .filter(([k]) => !isNaN(Number(k)))
                            .map(([_, v]: [string, any]) =>
                                (v && typeof v === 'object' && v.value && typeof v.value === 'object' && v.value.key)
                                    ? String(v.value.key) : null
                            )
                            .filter((k): k is string => !!k);

                        for (const key of candidateKeys) {
                            const facility = facilities.find((f: any) => String(f.id) === String(key));
                            if (facility) return facility.name;
                        }

                        const firstMatchedField = Object.entries(fb.info)
                            .filter(([k]) => !isNaN(Number(k)))
                            .find(([_, v]: [string, any]) => v?.value?.key && v?.value?.value);

                        if (firstMatchedField) {
                            return String((firstMatchedField[1] as any).value.value);
                        }
                    }
                    const facilityId = fb.info?.facility_id || fb.facility_id;
                    const facility = facilities.find((f: any) => String(f.id) === String(facilityId));
                    return facility ? facility.name : (fb.fullName || fb.name || `Đơn vị (${facilityId || '?'})`);
                });
                data.phuLuc.push({
                    nhom: cat.nhom,
                    danhSach: Array.from(new Set(facilityNames))
                });
            }
        });

        return data;
    }, [feedbacks, formTemplates, groupedFeedbacks, facilities]);

    const exportToWord = async () => {
        await exportTCT01ToWord(
            reportData, dateFilter, setLoading,
            (msg) => toast.current?.show({ severity: 'success', summary: 'Thành công', detail: msg }),
            (msg) => toast.current?.show({ severity: 'error', summary: 'Lỗi', detail: msg })
        );
    };

    const exportToPDF = async () => {
        await exportTCT01ToPDF(
            reportData, dateFilter, setLoading,
            (msg) => toast.current?.show({ severity: 'success', summary: 'Thành công', detail: msg }),
            (msg) => toast.current?.show({ severity: 'error', summary: 'Lỗi', detail: msg })
        );
    };

    const reportHeader = (
        <ReportHeader
            title="Kết quả tiếp nhận báo cáo từ ngày"
            dateFilter={dateFilter}
            loading={loading}
            disabledExport={feedbacks.length === 0}
            onExportWord={exportToWord}
            onExportPDF={exportToPDF}
        />
    );

    return (
        <AdminLayout title="Báo cáo kết quả thực hiện" subtitle="Kết quả thực hiện của Tổ công tác số 01">
            <Toast ref={toast} />

            <div className="space-y-6">
                <FeedbackFilters
                    filterType={filterType}
                    handleFilterChange={handleFilterChange}
                    dateFilter={dateFilter}
                    handleCustomDateChange={handleCustomDateChange}
                    reportHeader={reportHeader}
                />

                {loading ? (
                    <ReportLoadingState />
                ) : feedbacks.length > 0 ? (
                    <>
                        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                            <TabView className="styled-tabview" scrollable>
                                <TabPanel header={reportData.benhVien.title}>
                                    <TCT01TabContent
                                        feedbacks={groupedFeedbacks['3']?.items || []}
                                        formTemplate={formTemplates['3']}
                                    />
                                </TabPanel>
                                <TabPanel header={reportData.troGiupXaHoi.title}>
                                    <TCT01TabContent
                                        feedbacks={groupedFeedbacks['17']?.items || []}
                                        formTemplate={formTemplates['17']}
                                    />
                                </TabPanel>
                                <TabPanel header={reportData.tramYTe.title}>
                                    <TCT01TabContent
                                        feedbacks={groupedFeedbacks['18']?.items || []}
                                        formTemplate={formTemplates['18']}
                                    />
                                </TabPanel>
                            </TabView>
                        </div>

                        {/* Phụ lục danh sách các đơn vị */}
                        <ReportAppendix groupedFeedbacks={groupedFeedbacks} />
                    </>
                ) : (
                    <ReportEmptyState message="Không tìm thấy báo cáo nào trong khoảng thời gian đã chọn." />
                )}
            </div>

            <StyledTabViewCSS />
        </AdminLayout>
    )
}

export default Report_TCT01;