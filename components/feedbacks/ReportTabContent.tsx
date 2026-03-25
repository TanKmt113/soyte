import React, { useState, useEffect, useMemo } from 'react';
import { formService } from '@/services/formService';
import { FeedbackItem } from '@/types/feedbacks';
import { useFacilities } from '@/hooks/useFacilities';

interface ReportTabContentProps {
    formId: string;
    feedbacks: FeedbackItem[];
    dateFilter: { startDate: string, endDate: string };
    filterType: string;
    totalUnits?: number;
    formTemplate?: any; // Nhận template đã fetch từ cha
}

export const ReportTabContent: React.FC<ReportTabContentProps> = ({
    formId,
    feedbacks,
    dateFilter,
    formTemplate: propTemplate
}) => {
    const { facilities } = useFacilities();
    const [detailedFeedbacks, setDetailedFeedbacks] = useState<any[]>([]);
    const [formTemplate, setFormTemplate] = useState<any>(propTemplate || null);
    // const [isDetailedTableExpanded, setIsDetailedTableExpanded] = useState(true);
    const [expandedGroups, setExpandedGroups] = useState<Record<number, boolean>>({});

    // Tính tổng số đơn vị dự kiến dựa trên thông tin biểu mẫu gốc
    const totalUnits = useMemo(() => {
        if (!formTemplate) return 0;

        // Metadata của biểu mẫu có thể lưu trong 'info' hoặc 'data.info' tùy vào cách lấy dữ liệu
        const infoSource = formTemplate.info || formTemplate.data?.info;
        if (!infoSource) return 0;

        // Tìm trường thông tin xác định đơn vị nào cần báo cáo
        // Tìm loại 'facility_multiselect' hoặc tiêu đề có chứa 'Cơ sở y tế' hoặc 'Đơn vị'
        let facilityField: any = null;

        const findInArray = (arr: any[]) => {
            return arr.find((i: any) =>
                i.type === 'facility_multiselect' ||
                (i.title && (i.title.toLowerCase().includes('cơ sở y tế') || i.title.toLowerCase().includes('đơn vị')))
            );
        };

        if (Array.isArray(infoSource)) {
            facilityField = findInArray(infoSource);
        } else if (typeof infoSource === 'object') {
            const values = Object.values(infoSource);
            facilityField = findInArray(values);
        }

        if (!facilityField) return 0;

        // 1. Nếu các đơn vị được chọn thủ công (danh sách cố định)
        if (facilityField.option && Array.isArray(facilityField.option) && facilityField.option.length > 0) {
            return facilityField.option.length;
        }

        // 2. Nếu là danh sách động dựa trên loại đơn vị (VD: tất cả TYT)
        const selectedTypes = facilityField.facilityTypeFilter || [];
        const filteredFacilities = facilities.filter(f =>
            selectedTypes.length === 0 || selectedTypes.includes(f.type)
        );
        return filteredFacilities.length;
    }, [formTemplate, facilities]);

    // Thống kê tổng hợp tình hình báo cáo 
    const summaryStats = useMemo(() => {
        const reportedCount = feedbacks.length;
        const unReportingCount = Math.max(0, totalUnits - reportedCount);

        let onTimeCount = 0;
        let lateCount = 0;

        // Phân loại "Đúng hạn" và "Không đúng hạn" dựa trên cấu hình thời gian áp dụng của biểu mẫu
        if (formTemplate && (formTemplate.startDate || formTemplate.endDate)) {
            const startLimit = formTemplate.startDate ? new Date(formTemplate.startDate) : null;
            const endLimit = formTemplate.endDate ? new Date(formTemplate.endDate) : null;

            // Thiết lập mốc thời gian so sánh (đầu ngày bắt đầu và cuối ngày kết thúc)
            if (startLimit) startLimit.setHours(0, 0, 0, 0);
            if (endLimit) endLimit.setHours(23, 59, 59, 999);

            feedbacks.forEach(fb => {
                // Ưu tiên các trường thời gian có sẵn: createdAt, created_at hoặc date
                const submissionDate = new Date(fb.createdAt || fb.created_at || fb.date || Date.now());

                // Điều kiện đúng hạn: Sau (hoặc bằng) ngày bắt đầu VÀ Trước (hoặc bằng) ngày kết thúc
                const isAfterStart = !startLimit || submissionDate >= startLimit;
                const isBeforeEnd = !endLimit || submissionDate <= endLimit;

                if (isAfterStart && isBeforeEnd) {
                    onTimeCount++;
                } else {
                    lateCount++;
                }
            });
        } else {
            // Nếu biểu mẫu không quy định thời gian, coi như tất cả báo cáo gửi lên là đúng hạn
            onTimeCount = reportedCount;
        }

        return [
            { id: 1, name: 'Đơn vị báo cáo', count: reportedCount, rate: totalUnits > 0 ? `${((reportedCount / totalUnits) * 100).toFixed(1)}%` : '0%' },
            { id: 2, name: 'Đơn vị không báo cáo', count: unReportingCount, rate: totalUnits > 0 ? `${(unReportingCount / totalUnits * 100).toFixed(1)}%` : '0%' },
            { id: 3, name: 'Đơn vị báo cáo đúng hạn', count: onTimeCount, rate: totalUnits > 0 ? `${((onTimeCount / totalUnits) * 100).toFixed(1)}%` : '0%' },
            { id: 4, name: 'Đơn vị báo cáo không đúng hạn', count: lateCount, rate: totalUnits > 0 ? `${((lateCount / totalUnits) * 100).toFixed(1)}%` : '0%' },
        ];
    }, [feedbacks, totalUnits, formTemplate]);
    useEffect(() => {
        // Luôn cập nhật template khi dữ liệu từ cha (propTemplate) thay đổi
        if (propTemplate) {
            setFormTemplate(propTemplate);
        }
    }, [propTemplate]);

    // Trạng thái loading cho riêng phần biểu mẫu nếu dữ liệu từ cha chưa về kịp
    const isTemplateLoading = !formTemplate && formId && formId !== 'unknown';

    useEffect(() => {
        // Cập nhật chi tiết khi feedbacks từ cha truyền xuống thay đổi
        setDetailedFeedbacks(feedbacks || []);
    }, [feedbacks]);

    // Tổng hợp dữ liệu từ các section để xây dựng Bảng 2
    // Đếm số lượng đơn vị đã làm, đang làm, chưa làm cho mỗi nội dung kiểm tra
    const aggregatedChecks = React.useMemo(() => {
        if (!detailedFeedbacks || detailedFeedbacks.length === 0) return [];

        // Sử dụng các section của phản hồi đầu tiên làm cấu trúc mẫu
        const templateSections = detailedFeedbacks[0].sections;
        if (!templateSections || templateSections.length === 0) return [];

        const aggregated = templateSections.map((group: any) => {
            return {
                name: group.name,
                options: group.option.map((optTemplate: any) => {
                    // Tìm các tùy chọn tương ứng trong tất cả phản hồi
                    let daLam = 0;
                    let dangLam = 0;
                    let chuaLam = 0;

                    detailedFeedbacks.forEach(fb => {
                        if (!fb.sections) return;
                        // Tìm nhóm và tùy chọn này trong phản hồi
                        const fbGroup = fb.sections.find((g: any) => g.name === group.name);
                        if (fbGroup && fbGroup.option) {
                            const fbOpt = fbGroup.option.find((o: any) => o.content === optTemplate.content);
                            if (fbOpt) {
                                const tiendo = Number(fbOpt.tiendo);
                                if (tiendo === 1) daLam++;
                                else if (tiendo === 2) dangLam++;
                                else if (tiendo === 3) chuaLam++;
                            }
                        }
                    });

                    return {
                        content: optTemplate.content,
                        method: optTemplate.method,
                        productOut: optTemplate.productOut,
                        statusCounts: { daLam, dangLam, chuaLam }
                    };
                })
            };
        });

        return aggregated;
    }, [detailedFeedbacks]);


    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {totalUnits > 0 && (
                <div className="text-slate-800 font-bold text-lg mb-2">
                    Tổng số: <span className="text-primary-700">{totalUnits}</span> đơn vị.
                </div>
            )}
            {/* Bảng 1: Thống kê tổng hợp */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="bg-slate-50 border-b border-slate-200 px-6 py-4">
                    <h3 className="font-bold text-slate-800 text-lg">Tổng hợp tình hình báo cáo</h3>
                </div>
                <div className="overflow-x-auto p-6">
                    <table className="w-full border-collapse border border-slate-300">
                        <thead className="bg-primary-900 text-white">
                            <tr>
                                <th className="border border-slate-600 p-3 text-center font-semibold w-16">STT</th>
                                <th className="border border-slate-600 p-3 text-left font-semibold">Nội dung</th>
                                <th className="border border-slate-600 p-3 text-center font-semibold w-32">Số lượng</th>
                                <th className="border border-slate-600 p-3 text-center font-semibold w-32">Tỷ lệ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {summaryStats.map((stat) => (
                                <tr key={stat.id} className="hover:bg-slate-50 border-b border-slate-200">
                                    <td className="border border-slate-300 p-3 text-center text-slate-700 font-medium">{stat.id}</td>
                                    <td className="border border-slate-300 p-3 text-slate-800 font-medium">{stat.name}</td>
                                    <td className="border border-slate-300 p-3 text-center font-bold text-primary-700">{stat.count}</td>
                                    <td className="border border-slate-300 p-3 text-center font-bold text-slate-600">{stat.rate}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Bảng 2: Chi tiết các nội dung kiểm tra */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div
                    className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex justify-between items-center cursor-pointer hover:bg-slate-100 transition-colors"
                // onClick={() => setIsDetailedTableExpanded(!isDetailedTableExpanded)}
                >
                    <div>
                        <h3 className="font-bold text-slate-800 text-lg">Chi tiết tình trạng thực hiện các nội dung kiểm tra</h3>
                        <p className="text-sm text-slate-500 mt-1 italic">(Chỉ phân tích trên {feedbacks.length} đơn vị gửi báo cáo)</p>
                    </div>
                    {/* <div className="w-10 h-10 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-400 shadow-sm hover:text-primary-600 transition-all">
                        <i className={`pi ${isDetailedTableExpanded ? 'pi-chevron-up' : 'pi-chevron-down'} font-bold`}></i>
                    </div> */}
                </div>

                <div className="overflow-x-auto p-6 animate-in slide-in-from-top-2 duration-300">
                    {isTemplateLoading ? (
                        <div className="flex justify-center items-center py-10">
                            <i className="pi pi-spin pi-spinner text-3xl text-primary-500"></i>
                            <span className="ml-3 text-slate-500">Đang tải chi tiết biểu mẫu...</span>
                        </div>
                    ) : aggregatedChecks.length > 0 ? (
                        <table className="w-full border-collapse border border-slate-300">
                            <thead className="bg-primary-900 text-white">
                                <tr>
                                    <th rowSpan={2} className="border border-slate-600 p-3 text-center font-semibold w-16 align-middle">STT</th>
                                    <th rowSpan={2} className="border border-slate-600 p-3 text-center font-semibold w-[30%] align-middle">Nội dung kiểm tra</th>
                                    <th rowSpan={2} className="border border-slate-600 p-3 text-center font-semibold w-[20%] align-middle">Phương thức thực hiện</th>
                                    <th rowSpan={2} className="border border-slate-600 p-3 text-center font-semibold w-[20%] align-middle">Bằng chứng, kết quả</th>
                                    <th colSpan={3} className="border border-slate-600 p-2 text-center font-semibold border-b-0">Tình trạng thực hiện</th>
                                </tr>
                                <tr>
                                    <th className="border border-slate-600 p-2 text-center text-sm">Đã thực hiện<br /><span className="text-xs font-normal opacity-80">(số đơn vị)</span></th>
                                    <th className="border border-slate-600 p-2 text-center text-sm">Đang thực hiện<br /><span className="text-xs font-normal opacity-80">(số đơn vị)</span></th>
                                    <th className="border border-slate-600 p-2 text-center text-sm">Chưa thực hiện<br /><span className="text-xs font-normal opacity-80">(số đơn vị)</span></th>
                                </tr>
                            </thead>
                            <tbody>
                                {(() => {
                                    let globalIdx = 0;
                                    const roman = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII", "XIV", "XV"];
                                    return aggregatedChecks.map((group: any, gi: number) => {
                                        const isGroupExpanded = expandedGroups[gi] !== false;
                                        const groupStats = group.options.reduce((acc: any, opt: any) => {
                                            acc.daLam += opt.statusCounts.daLam;
                                            acc.dangLam += opt.statusCounts.dangLam;
                                            acc.chuaLam += opt.statusCounts.chuaLam;
                                            return acc;
                                        }, { daLam: 0, dangLam: 0, chuaLam: 0 });

                                        const formatStats = (total: number) => {
                                            return total === 0 ? '0' : total.toString();
                                        };

                                        return (
                                            <React.Fragment key={gi}>
                                                <tr
                                                    className="bg-primary-800 text-white cursor-pointer hover:bg-primary-700 transition-colors"
                                                    onClick={() => setExpandedGroups(prev => ({ ...prev, [gi]: !isGroupExpanded }))}
                                                >
                                                    <td className="border border-slate-600 p-2 text-center font-bold">
                                                        {roman[gi] || gi + 1}
                                                    </td>
                                                    <td colSpan={3} className="border border-slate-600 p-3 text-left font-bold text-sm">
                                                        <div className="flex justify-between items-center">
                                                            <span>{group.name || `Nhóm nội dung ${gi + 1}`}</span>
                                                            <i className={`pi ${isGroupExpanded ? 'pi-chevron-up' : 'pi-chevron-down'} text-xs ml-2 opacity-80`}></i>
                                                        </div>
                                                    </td>
                                                    <td className="border border-slate-600 p-2 text-center font-bold text-xs">
                                                        {formatStats(groupStats.daLam)}
                                                    </td>
                                                    <td className="border border-slate-600 p-2 text-center font-bold text-xs">
                                                        {formatStats(groupStats.dangLam)}
                                                    </td>
                                                    <td className="border border-slate-600 p-2 text-center font-bold text-xs">
                                                        {formatStats(groupStats.chuaLam)}
                                                    </td>
                                                </tr>
                                                {isGroupExpanded && group.options.map((opt: any, oi: number) => {
                                                    globalIdx++;
                                                    return (
                                                        <tr key={oi} className="hover:bg-slate-50 border-b border-slate-300">
                                                            <td className="border border-slate-300 p-3 text-center text-slate-700 font-medium">{globalIdx}</td>
                                                            <td className="border border-slate-300 p-3 text-sm text-slate-800">
                                                                <div className="whitespace-pre-wrap">{opt.content}</div>
                                                            </td>
                                                            <td className="border border-slate-300 p-3 text-sm text-slate-700">
                                                                <div className="whitespace-pre-wrap">{opt.method}</div>
                                                            </td>
                                                            <td className="border border-slate-300 p-3 text-sm text-slate-700">
                                                                <div className="whitespace-pre-wrap">{opt.productOut}</div>
                                                            </td>
                                                            <td className="border border-slate-300 p-3 text-center font-semibold text-primary-700">{opt.statusCounts.daLam || '0'}</td>
                                                            <td className="border border-slate-300 p-3 text-center font-semibold text-orange-600">{opt.statusCounts.dangLam || '0'}</td>
                                                            <td className="border border-slate-300 p-3 text-center font-semibold text-red-600">{opt.statusCounts.chuaLam || '0'}</td>
                                                        </tr>
                                                    );
                                                })}
                                            </React.Fragment>
                                        );
                                    });
                                })()}
                            </tbody>
                        </table>
                    ) : (
                        <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                            <i className="pi pi-inbox text-4xl text-slate-300 mb-3 block"></i>
                            <p className="text-slate-500">Chưa có dữ liệu phản hồi cho biểu mẫu này để phân tích.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
