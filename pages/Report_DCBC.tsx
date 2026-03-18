import AdminLayout from '@/components/AdminLayout'
import React, { useState, useEffect, useRef, useMemo } from 'react'
import { feedBacksSevice } from '@/services/feedBacksSevice'
import { ReportTabContent } from '@/components/feedbacks/ReportTabContent'
import { FeedbackFilters } from '@/components/feedbacks/FeedbackFilters'
import { Toast } from '@/components/prime'
import { TabView, TabPanel } from 'primereact/tabview'
import { FeedbackItem } from '@/types/feedbacks'

import { formatDateVN, getDefaultDates } from '@/utils/dateUtils'

const Report_DCBC = () => {
    const toast = useRef<Toast>(null);
    const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
    const [loading, setLoading] = useState(false);

    // Bộ lọc
    const [filterType, setFilterType] = useState('this_year');
    const [dateFilter, setDateFilter] = useState(getDefaultDates());

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

    const handleFilterChange = (newType: string) => {
        setFilterType(newType);
        const now = new Date();
        const year = now.getFullYear();
        const formatDate = (date: Date) => {
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
            startDate: formatDate(start),
            endDate: formatDate(end)
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

    // Nhóm các phản hồi theo Biểu mẫu
    const groupedFeedbacks = useMemo<Record<string, { title: string, items: FeedbackItem[] }>>(() => {
        // Dựa vào API để lọc theo ngày, nên lấy tất cả các phản hồi trả về
        const groups: Record<string, { title: string, items: FeedbackItem[] }> = {};

        feedbacks.forEach(fb => {
            const fId = fb.form_id || 'unknown';
            let title = "";

            if (fId === 3) {
                title = "Khối các bệnh viện trực thuộc"
            }
            if (fId === 17) {
                title = "Đơn vị trợ giúp xã hội trực thuộc"
            }
            if (fId === 18) {
                title = "Khối các trạm y tế xã, phường"
            }

            if (!groups[fId]) {
                groups[fId] = {
                    title: title || fb.info?.title || `Mẫu phản ánh (${fId})`,
                    items: []
                };
            }
            groups[fId].items.push(fb);
        });

        return groups;
    }, [feedbacks]);

    const reportHeader = (
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center">
                <i className="pi pi-chart-bar text-primary-600 text-xl"></i>
            </div>
            <h2 className="text-lg md:text-xl font-bold text-slate-800 tracking-tight">
                Kết quả tiếp nhận báo cáo từ ngày <span className="text-primary-700">{formatDateVN(dateFilter.startDate)}</span> đến ngày <span className="text-primary-700">{formatDateVN(dateFilter.endDate)}</span>
            </h2>
        </div>
    );

    return (
        <AdminLayout title="Đề cương báo cáo (DCBC)" subtitle="Báo cáo tình hình tiếp nhận và xử lý phản ánh, kiến nghị">
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
                    <div className="flex justify-center items-center py-20 bg-white rounded-3xl shadow-sm border border-slate-100">
                        <i className="pi pi-spin pi-spinner text-4xl text-primary-500"></i>
                        <span className="ml-3 text-lg font-medium text-slate-600">Đang tải dữ liệu tổng hợp...</span>
                    </div>
                ) : Object.keys(groupedFeedbacks).length > 0 ? (
                    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                        <TabView className="styled-tabview" scrollable>
                            {Object.entries(groupedFeedbacks).map(([formId, group]: [string, any]) => (
                                <TabPanel
                                    key={formId}
                                    header={
                                        <span title={group.title} className="block font-semibold">
                                            {group.title}
                                        </span>
                                    }
                                >
                                    <div className="p-4 md:p-6 bg-slate-50 min-h-[50vh]">
                                        <ReportTabContent
                                            formId={formId}
                                            feedbacks={group.items}
                                            dateFilter={dateFilter}
                                            filterType={filterType}
                                        />
                                    </div>
                                </TabPanel>
                            ))}
                        </TabView>
                    </div>
                ) : (
                    <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-slate-100">
                        <div className="inline-flex w-20 h-20 bg-slate-50 items-center justify-center rounded-full mb-4">
                            <i className="pi pi-inbox text-4xl text-slate-300"></i>
                        </div>
                        <h3 className="text-xl font-bold text-slate-700 mb-2">Không có dữ liệu báo cáo</h3>
                        <p className="text-slate-500">Không tìm thấy phản ánh nào trong khoảng thời gian đã chọn.</p>
                    </div>
                )}
            </div>

            <style>{`
                .styled-tabview .p-tabview-nav {
                    background: transparent;
                    border-bottom: 1px solid #e2e8f0;
                    padding: 0 1.5rem;
                }
                .styled-tabview .p-tabview-nav li .p-tabview-nav-link {
                    background: transparent;
                    border: none;
                    border-bottom: 2px solid transparent;
                    color: #64748b;
                    font-weight: 600;
                    padding: 1rem 1.25rem;
                    transition: all 0.2s;
                    box-shadow: none !important;
                    display: block;
                    max-width: 400px; 
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }
                .styled-tabview .p-tabview-nav li:not(.p-highlight):hover .p-tabview-nav-link {
                    color: #475569;
                    border-color: #cbd5e1;
                    background: #f8fafc;
                }
                .styled-tabview .p-tabview-nav li.p-highlight .p-tabview-nav-link {
                    color: #1e3a8a; 
                    border-color: #1e40af; 
                    background: #eff6ff;
                }
                .styled-tabview .p-tabview-panels {
                    padding: 0;
                    background: transparent;
                    border: none;
                }
            `}</style>
        </AdminLayout>
    )
}

export default Report_DCBC;