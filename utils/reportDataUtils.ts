import { FeedbackItem } from '@/types/feedbacks';

/**
 * Tính toán tổng số đơn vị dự kiến báo cáo dựa trên template
 */
export const calculateTotalUnits = (template: any, facilities: any[] = []): number => {
    if (!template) return 0;
    const infoSource = template.info || template.data?.info;
    let facilityField: any = null;
    const findInArray = (arr: any[]) => arr.find((i: any) =>
        i.type === 'facility_multiselect' ||
        (i.title && (i.title.toLowerCase().includes('cơ sở y tế') || i.title.toLowerCase().includes('đơn vị')))
    );

    if (Array.isArray(infoSource)) facilityField = findInArray(infoSource);
    else if (typeof infoSource === 'object') facilityField = findInArray(Object.values(infoSource));

    if (!facilityField) return 0;

    if (facilityField.option && Array.isArray(facilityField.option) && facilityField.option.length > 0) {
        return facilityField.option.length;
    }

    const selectedTypes = facilityField.facilityTypeFilter || [];
    return (facilities || []).filter(f => selectedTypes.length === 0 || selectedTypes.includes(f.type)).length;
};

/**
 * Phân loại báo cáo đúng hạn và muộn
 */
export const calculateOnTimeStats = (items: FeedbackItem[], template: any) => {
    let onTime = 0;
    let late = 0;
    const reportedCount = items.length;

    if (template && (template.startDate || template.endDate)) {
        const startLimit = template.startDate ? new Date(template.startDate) : null;
        const endLimit = template.endDate ? new Date(template.endDate) : null;
        if (startLimit) startLimit.setHours(0, 0, 0, 0);
        if (endLimit) endLimit.setHours(23, 59, 59, 999);

        items.forEach(fb => {
            const submissionDate = new Date(fb.createdAt || fb.created_at || fb.date || Date.now());
            const isAfterStart = !startLimit || submissionDate >= startLimit;
            const isBeforeEnd = !endLimit || submissionDate <= endLimit;
            if (isAfterStart && isBeforeEnd) onTime++; else late++;
        });
    } else {
        onTime = reportedCount;
    }

    return { onTimeCount: onTime, lateCount: late };
};

export const formatRate = (count: number, total: number) => total > 0 ? `${((count / total) * 100).toFixed(0)}%` : '0%';
