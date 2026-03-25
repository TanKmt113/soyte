import React from 'react';
import { FeedbackItem } from '@/types/feedbacks';
import { useFacilities } from '@/hooks/useFacilities'

interface ReportAppendixProps {
    groupedFeedbacks: Record<string, { title: string, items: FeedbackItem[] }>;
}

export const ReportAppendix: React.FC<ReportAppendixProps> = ({ groupedFeedbacks }) => {
    const { facilities } = useFacilities();
    const roman = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];

    const sortedEntries = Object.entries(groupedFeedbacks).sort((a, b) => {
        const order: Record<string, number> = { "3": 1, "17": 2, "18": 3 };
        return (order[a[0]] || 99) - (order[b[0]] || 99);
    });

    const getUnitName = (item: FeedbackItem) => {
        if (item.info) {
            const candidateKeys = Object.entries(item.info)
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

            const firstMatchedField = Object.entries(item.info)
                .filter(([k]) => !isNaN(Number(k)))
                .find(([_, v]: [string, any]) => v?.value?.key && v?.value?.value);

            if (firstMatchedField) {
                return String((firstMatchedField[1] as any).value.value);
            }
        }
        return item.fullName || item.name || 'Chưa xác định';
    };

    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mt-10">
            <div className="bg-slate-50 border-b border-slate-200 px-6 py-5 flex justify-between items-center bg-gradient-to-r from-slate-50 to-white">
                <div>
                    <h3 className="font-bold text-slate-800 text-lg uppercase tracking-tight">PHỤ LỤC</h3>
                    <p className="text-sm text-slate-500 mt-0.5 italic">Danh mục các đơn vị đã thực hiện báo cáo trong kỳ</p>
                </div>
            </div>

            <div className="p-6 md:p-8 overflow-x-auto bg-slate-50/10">
                <table className="w-full border-collapse border border-slate-400 bg-white">
                    <thead className="bg-primary-900 text-white">
                        <tr>
                            <th className="border border-slate-500 p-4 text-center font-bold w-24 uppercase text-xs tracking-widest">STT</th>
                            <th className="border border-slate-500 p-4 text-left font-bold uppercase text-xs tracking-widest">Tên đơn vị tham gia báo cáo</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedEntries.length > 0 ? (
                            sortedEntries.map(([formId, group]: [string, any], gi) => (
                                <React.Fragment key={formId}>
                                    <tr className="bg-slate-100/80 border-b border-slate-400">
                                        <td className="border border-slate-400 p-4 text-center font-black text-primary-900">
                                            {roman[gi] || gi + 1}
                                        </td>
                                        <td className="border border-slate-400 p-4 text-left font-bold text-primary-900 italic uppercase text-sm tracking-tight">
                                            {group.title}
                                        </td>
                                    </tr>
                                    {group.items.map((fb: FeedbackItem, ii: number) => (
                                        <tr key={fb.id || fb._id || ii} className="border-b border-slate-400">
                                            <td className="border border-slate-400 p-4 text-center text-slate-700 font-medium">
                                                {ii + 1}
                                            </td>
                                            <td className="border border-slate-400 p-4 text-left text-slate-800 font-semibold">
                                                {getUnitName(fb)}
                                            </td>
                                        </tr>
                                    ))}
                                </React.Fragment>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={2} className="p-10 text-center text-slate-400 italic bg-slate-50">
                                    Không có dữ liệu tham gia báo cáo.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
