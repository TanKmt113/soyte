import React, { useState, useEffect, useMemo } from 'react';
import { feedBacksSevice } from '@/services/feedBacksSevice';
import { formService } from '@/services/formService';
import { FeedbackItem } from '@/types/feedbacks';
import { ALL_FACILITIES } from '@/constants';

interface ReportTabContentProps {
    formId: string;
    feedbacks: FeedbackItem[];
    dateFilter: { startDate: string, endDate: string };
    filterType: string;
}

export const ReportTabContent: React.FC<ReportTabContentProps> = ({ formId, feedbacks, dateFilter, filterType }) => {
    const [loading, setLoading] = useState(false);
    const [detailedFeedbacks, setDetailedFeedbacks] = useState<any[]>([]);
    const [formTemplate, setFormTemplate] = useState<any>(null);

    // Calculate total expected units based on original form template info
    const totalUnits = useMemo(() => {
        if (!formTemplate) return 0;
        console.log(formTemplate);
        // Form metadata can store info in 'info' or 'data.info' depending on how it was fetched
        const infoSource = formTemplate.info || formTemplate.data?.info;
        if (!infoSource) return 0;

        // Find the field that defines which units should report
        // We look for 'facility_multiselect' type or a title that looks like 'Cơ sở y tế'
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

        // 1. If units were manually picked (fixed list)
        if (facilityField.option && Array.isArray(facilityField.option) && facilityField.option.length > 0) {
            return facilityField.option.length;
        }

        // 2. If it's a dynamic list based on type (e.g. all TYTs)
        const selectedTypes = facilityField.facilityTypeFilter || [];
        const filteredFacilities = ALL_FACILITIES.filter(f =>
            selectedTypes.length === 0 || selectedTypes.includes(f.type)
        );
        return filteredFacilities.length;
    }, [formTemplate]);

    // Summary Stats
    const summaryStats = [
        { id: 1, name: 'Đơn vị báo cáo', count: feedbacks.length, rate: totalUnits > 0 ? `${((feedbacks.length / totalUnits) * 100).toFixed(1)}%` : '0%' }, // Placeholder
        { id: 2, name: 'Đơn vị không báo cáo', count: Math.max(0, totalUnits - feedbacks.length), rate: totalUnits > 0 ? `${(Math.max(0, totalUnits - feedbacks.length) / totalUnits * 100).toFixed(1)}%` : '0%' }, // Placeholder
        { id: 3, name: 'Đơn vị báo cáo đúng hạn', count: 0, rate: '0%' }, // Placeholder
        { id: 4, name: 'Đơn vị báo cáo không đúng hạn', count: 0, rate: '0%' }, // Placeholder
    ];
    useEffect(() => {
        const fetchDetailsAndTemplate = async () => {
            setLoading(true);
            try {
                // Fetch template metadata to calculate total units
                if (formId && formId !== 'unknown') {
                    const tplRes = await formService.fetchFormById(formId);
                    const tplData = tplRes.data || tplRes;
                    setFormTemplate(tplData);
                }

                // Fetch details for all feedbacks in this tab to get the 'sections'
                if (feedbacks.length > 0) {
                    const promises = feedbacks.map(async (fb) => {
                        const id = fb.id || fb._id;
                        if (!id) return null;
                        const response = await feedBacksSevice.fetchFeedBackById(id);
                        const data = response.data || response;
                        const fbData = data.data || data;
                        return fbData;
                    });

                    const results = await Promise.all(promises);
                    setDetailedFeedbacks(results.filter(r => r !== null));
                } else {
                    setDetailedFeedbacks([]);
                }
            } catch (error) {
                console.error("Error fetching detailed feedbacks and template:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDetailsAndTemplate();
    }, [feedbacks, formId]);

    // Aggregate data from sections to build Table 2
    // We want to count how many units have done, doing, not done each check item
    const aggregatedChecks = React.useMemo(() => {
        if (!detailedFeedbacks || detailedFeedbacks.length === 0) return [];

        // Use the first feedback's sections as template structure
        const templateSections = detailedFeedbacks[0].sections;
        if (!templateSections || templateSections.length === 0) return [];

        const aggregated = templateSections.map((group: any) => {
            return {
                name: group.name,
                options: group.option.map((optTemplate: any) => {
                    // Find matching options in all feedbacks
                    let daLam = 0;
                    let dangLam = 0;
                    let chuaLam = 0;

                    detailedFeedbacks.forEach(fb => {
                        if (!fb.sections) return;
                        // Find this group and option in fb
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
            {/* Table 1: Summary Statistics */}
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

            {/* Table 2: Detailed Checks */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="bg-slate-50 border-b border-slate-200 px-6 py-4">
                    <h3 className="font-bold text-slate-800 text-lg">Chi tiết tình trạng thực hiện các nội dung kiểm tra</h3>
                    <p className="text-sm text-slate-500 mt-1 italic">(Chỉ phân tích trên {feedbacks.length} đơn vị gửi báo cáo)</p>
                </div>
                <div className="overflow-x-auto p-6">
                    {loading ? (
                        <div className="flex justify-center items-center py-10">
                            <i className="pi pi-spin pi-spinner text-3xl text-primary-500"></i>
                            <span className="ml-3 text-slate-500">Đang tải chi tiết báo cáo...</span>
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
                                    return aggregatedChecks.map((group: any, gi: number) => (
                                        <React.Fragment key={gi}>
                                            <tr className="bg-primary-800 text-white">
                                                <td className="border border-slate-600 p-2 text-center font-bold">
                                                    {roman[gi] || gi + 1}
                                                </td>
                                                <td colSpan={6} className="border border-slate-600 p-3 text-left font-bold text-sm">
                                                    {group.name || `Nhóm nội dung ${gi + 1}`}
                                                </td>
                                            </tr>
                                            {group.options.map((opt: any, oi: number) => {
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
                                                        <td className="border border-slate-300 p-3 text-center font-semibold text-primary-700">{opt.statusCounts.daLam || '---'}</td>
                                                        <td className="border border-slate-300 p-3 text-center font-semibold text-orange-600">{opt.statusCounts.dangLam || '---'}</td>
                                                        <td className="border border-slate-300 p-3 text-center font-semibold text-red-600">{opt.statusCounts.chuaLam || '---'}</td>
                                                    </tr>
                                                );
                                            })}
                                        </React.Fragment>
                                    ));
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
