import { jsPDF } from "jspdf"
import autoTable from 'jspdf-autotable'
import { formService } from '@/services/formService'
import { feedBacksSevice } from '@/services/feedBacksSevice'
import { ALL_FACILITIES } from '@/constants'
import { TIMES_REGULAR_BASE64, TIMES_BOLD_BASE64 } from '@/utils/pdfFonts'
import { formatDateVN } from '@/utils/dateUtils'
import { FeedbackItem } from '@/types/feedbacks'

export const exportReportToPDF = async (
    groupedFeedbacks: Record<string, { title: string, items: FeedbackItem[] }>,
    dateFilter: { startDate: string, endDate: string },
    setLoading: (val: boolean) => void,
    onSuccess: (msg: string) => void,
    onError: (msg: string) => void
) => {
    setLoading(true);
    try {
        const doc = new jsPDF();

        // Đăng ký font Times New Roman hỗ trợ tiếng Việt (tuân thủ tốt jsPDF parser)
        doc.addFileToVFS('times.ttf', TIMES_REGULAR_BASE64);
        doc.addFont('times.ttf', 'TimesNewRoman', 'normal', 'Identity-H');
        doc.addFileToVFS('timesbd.ttf', TIMES_BOLD_BASE64);
        doc.addFont('timesbd.ttf', 'TimesNewRoman', 'bold', 'Identity-H');

        const FONT = 'TimesNewRoman';

        // --- Header chung của báo cáo chuẩn Word ---
        const drawHeader = (pageDoc: jsPDF) => {
            pageDoc.setFontSize(11);

            // Cột trái: Sở Y Tế
            pageDoc.setFont(FONT, 'normal');
            pageDoc.text('SỞ Y TẾ HÀ NỘI', 50, 15, { align: 'center' });
            pageDoc.setFont(FONT, 'bold');
            pageDoc.text('PHÒNG KIỂM TRA LĨNH VỰC Y TẾ', 50, 20, { align: 'center' });

            // Cột phải: Quốc hiệu
            pageDoc.setFont(FONT, 'bold');
            pageDoc.text('CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM', 150, 15, { align: 'center' });
            pageDoc.setFont(FONT, 'normal');
            pageDoc.text('Độc lập - Tự do - Hạnh phúc', 150, 20, { align: 'center' });
            pageDoc.line(125, 21, 175, 21); // Đường gạch chân

            // Ngày tháng
            const now = new Date();
            pageDoc.text(`Hà Nội, ngày ${String(now.getDate()).padStart(2, '0')} tháng ${String(now.getMonth() + 1).padStart(2, '0')} năm ${now.getFullYear()}`, 150, 28, { align: 'center' });
        };

        drawHeader(doc);

        // Tên báo cáo
        doc.setFontSize(14);
        doc.setFont(FONT, 'bold');
        doc.text('ĐỀ CƯƠNG BÁO CÁO', 105, 45, { align: 'center' });

        let currentY = 55;
        const mainRomanNumerals = ["I", "II", "III", "IV", "V"]; // Đánh số La Mã cho mục lớn

        // --- Duyệt qua từng nhóm để vẽ nội dung ---
        const formEntries = Object.entries(groupedFeedbacks) as [string, { title: string, items: FeedbackItem[] }][];

        for (let i = 0; i < formEntries.length; i++) {
            const [formId, group] = formEntries[i];
            if (formId === 'unknown') continue;

            // --- Phần logic tính toán totalUnits, onTimeCount, lateCount ---
            const tplRes = await formService.fetchFormById(formId);
            const formTemplate = tplRes.data || tplRes;

            let totalUnits = 0;
            const infoSource = formTemplate.info || formTemplate.data?.info;
            if (infoSource) {
                let facilityField: any = null;
                const findInArray = (arr: any[]) => arr.find((item: any) =>
                    item.type === 'facility_multiselect' ||
                    (item.title && (item.title.toLowerCase().includes('cơ sở y tế') || item.title.toLowerCase().includes('đơn vị')))
                );
                if (Array.isArray(infoSource)) facilityField = findInArray(infoSource);
                else if (typeof infoSource === 'object') facilityField = findInArray(Object.values(infoSource));

                if (facilityField) {
                    if (facilityField.option?.length > 0) totalUnits = facilityField.option.length;
                    else {
                        const selectedTypes = facilityField.facilityTypeFilter || [];
                        totalUnits = ALL_FACILITIES.filter(f => selectedTypes.length === 0 || selectedTypes.includes(f.type)).length;
                    }
                }
            }

            const reportedCount = group.items.length;
            const unReportingCount = Math.max(0, totalUnits - reportedCount);
            let onTimeCount = 0;
            let lateCount = 0;

            if (formTemplate && (formTemplate.startDate || formTemplate.endDate)) {
                const startLimit = formTemplate.startDate ? new Date(formTemplate.startDate) : null;
                const endLimit = formTemplate.endDate ? new Date(formTemplate.endDate) : null;
                if (startLimit) startLimit.setHours(0, 0, 0, 0);
                if (endLimit) endLimit.setHours(23, 59, 59, 999);

                group.items.forEach(fb => {
                    const submissionDate = new Date(fb.createdAt || fb.created_at || fb.date || Date.now());
                    const isAfterStart = !startLimit || submissionDate >= startLimit;
                    const isBeforeEnd = !endLimit || submissionDate <= endLimit;
                    if (isAfterStart && isBeforeEnd) onTimeCount++; else lateCount++;
                });
            } else {
                onTimeCount = reportedCount;
            }

            if (currentY > 240) { doc.addPage(); currentY = 25; drawHeader(doc); currentY = 40; }

            // Tiêu đề mục lớn (I, II, III...)
            doc.setFont(FONT, 'bold');
            doc.setFontSize(12);
            doc.text(`${mainRomanNumerals[i] || i + 1}. Kết quả triển khai thực hiện báo cáo của ${group.title.toLowerCase()}`, 20, currentY);
            currentY += 7;

            // Các dòng text chuẩn mẫu Word
            doc.setFont(FONT, 'normal');
            doc.text(`Kết quả tiếp nhận báo cáo (từ ngày ${formatDateVN(dateFilter.startDate)} đến ngày ${formatDateVN(dateFilter.endDate)}).`, 20, currentY);
            currentY += 7;
            doc.text(`Tổng số: ${totalUnits} đơn vị.`, 20, currentY);
            currentY += 5;

            // Table 1: Tỷ lệ báo cáo
            autoTable(doc, {
                startY: currentY,
                head: [['STT', 'Nội dung', 'Số lượng', 'Tỷ lệ']],
                body: [
                    ['1', 'Đơn vị báo cáo', reportedCount, totalUnits > 0 ? `${((reportedCount / totalUnits) * 100).toFixed(1)}%` : '0%'],
                    ['2', 'Đơn vị không báo cáo', unReportingCount, totalUnits > 0 ? `${(unReportingCount / totalUnits * 100).toFixed(1)}%` : '0%'],
                    ['3', 'Đơn vị báo cáo đúng hạn', onTimeCount, totalUnits > 0 ? `${((onTimeCount / totalUnits) * 100).toFixed(1)}%` : '0%'],
                    ['4', 'Đơn vị báo cáo không đúng hạn', lateCount, totalUnits > 0 ? `${((lateCount / totalUnits) * 100).toFixed(1)}%` : '0%'],
                ],
                styles: { font: FONT, fontSize: 11, textColor: [0, 0, 0], lineColor: [0, 0, 0], lineWidth: 0.1 },
                headStyles: { font: FONT, fontStyle: 'bold', fillColor: [255, 255, 255], textColor: [0, 0, 0], halign: 'center' },
                columnStyles: { 0: { halign: 'center', cellWidth: 15 }, 2: { halign: 'center', cellWidth: 30 }, 3: { halign: 'center', cellWidth: 30 } },
                theme: 'grid'
            });

            currentY = (doc as any).lastAutoTable.finalY + 8;

            // Nhận xét sau bảng 1
            doc.setFont(FONT, 'normal');
            doc.text('Nhận xét về tỷ lệ đơn vị gửi báo cáo:', 20, currentY);
            currentY += 6;
            doc.text('....................................................................................................................................................', 20, currentY);
            currentY += 8;

            doc.setFont(FONT, 'bold');
            doc.text(`Kết quả tổng hợp biểu mẫu đánh giá (theo Phụ lục ${i + 1})`, 20, currentY);
            currentY += 6;
            doc.setFont(FONT, 'normal');
            doc.text(`(Chỉ phân tích trên ${reportedCount} đơn vị gửi báo cáo).`, 20, currentY);
            currentY += 5;

            // --- Table 2: Chi tiết nội dung đánh giá ---
            if (reportedCount > 0) {
                const detailedPromises = group.items.map(async (fb) => {
                    const id = fb.id || fb._id;
                    const res = await feedBacksSevice.fetchFeedBackById(id);
                    const d = res.data || res;
                    return d.data || d;
                });
                const detailedFeedbacks = await Promise.all(detailedPromises);

                if (detailedFeedbacks[0]?.sections) {
                    const templateSections = detailedFeedbacks[0].sections;
                    const table2Body: any[] = [];
                    const sectionRoman = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
                    let sttCounter = 1; // Đếm STT liên tục cho toàn bảng

                    templateSections.forEach((sec: any, si: number) => {
                        // Tính toán tổng cho cả section trước khi thêm header
                        let secDaLam = 0, secDangLam = 0, secChuaLam = 0;
                        const optionRows: any[] = [];

                        sec.option.forEach((opt: any) => {
                            let daLam = 0, dangLam = 0, chuaLam = 0;
                            detailedFeedbacks.forEach(dfb => {
                                const dfbSec = dfb.sections?.find((s: any) => s.name === sec.name);
                                const dfbOpt = dfbSec?.option?.find((o: any) => o.content === opt.content);
                                if (dfbOpt) {
                                    const tiendo = Number(dfbOpt.tiendo);
                                    if (tiendo === 1) daLam++;
                                    else if (tiendo === 2) dangLam++;
                                    else if (tiendo === 3) chuaLam++;
                                }
                            });

                            secDaLam += daLam;
                            secDangLam += dangLam;
                            secChuaLam += chuaLam;

                            optionRows.push([
                                sttCounter++,
                                opt.content,
                                opt.method || '',
                                opt.productOut || '',
                                daLam || '0',
                                dangLam || '0',
                                chuaLam || '0'
                            ]);
                        });

                        // Thêm dòng tiêu đề mục (I, II, III...)
                        table2Body.push([
                            { content: sectionRoman[si] || si + 1, styles: { halign: 'center', fontStyle: 'bold' } },
                            { content: sec.name, colSpan: 3, styles: { fontStyle: 'bold' } },
                            { content: '', styles: { halign: 'center', fontStyle: 'bold' } },
                            { content: '', styles: { halign: 'center', fontStyle: 'bold' } },
                            { content: '', styles: { halign: 'center', fontStyle: 'bold' } }
                        ]);

                        // Thêm các dòng nội dung của mục đó
                        table2Body.push(...optionRows);
                    });

                    if (currentY > 230) { doc.addPage(); currentY = 25; drawHeader(doc); currentY = 40; }

                    autoTable(doc, {
                        startY: currentY,
                        head: [
                            [
                                { content: 'STT', rowSpan: 2 },
                                { content: 'Nội dung kiểm tra', rowSpan: 2 },
                                { content: 'Phương thức\nthực hiện', rowSpan: 2 },
                                { content: 'Bằng chứng,\nkết quả', rowSpan: 2 },
                                { content: 'Tình trạng thực hiện', colSpan: 3 }
                            ],
                            ['Đã thực hiện\n(số đơn vị)', 'Đang thực hiện\n(số đơn vị)', 'Chưa thực hiện\n(số đơn vị)']
                        ],
                        body: table2Body,
                        styles: { font: FONT, fontSize: 10, textColor: [0, 0, 0], lineColor: [0, 0, 0], lineWidth: 0.1 },
                        headStyles: { font: FONT, fontStyle: 'bold', fillColor: [255, 255, 255], textColor: [0, 0, 0], halign: 'center', valign: 'middle' },
                        columnStyles: {
                            0: { halign: 'center', cellWidth: 10 },
                            4: { halign: 'center', cellWidth: 20 },
                            5: { halign: 'center', cellWidth: 20 },
                            6: { halign: 'center', cellWidth: 20 }
                        },
                        theme: 'grid'
                    });
                    currentY = (doc as any).lastAutoTable.finalY + 8;

                    // Nhận xét sau bảng 2
                    doc.setFont(FONT, 'normal');
                    doc.text('Nhận xét về tỷ lệ đơn vị đã thực hiện, đang thực hiện và chưa thực hiện:', 20, currentY);
                    currentY += 6;
                    doc.text('....................................................................................................................................................', 20, currentY);
                    currentY += 15;
                }
            }
        }

        // --- Footer: Chữ ký cuối cùng ---
        if (currentY > 260) { doc.addPage(); currentY = 25; drawHeader(doc); currentY = 40; }
        const footerY = currentY + 10;
        doc.setFontSize(11);
        doc.setFont(FONT, 'bold');
        doc.text('NGƯỜI LẬP BIỂU', 50, footerY, { align: 'center' });
        doc.text('THỦ TRƯỞNG ĐƠN VỊ', 150, footerY, { align: 'center' });
        doc.setFont(FONT, 'normal');
        doc.text('(Ký, ghi rõ họ tên)', 50, footerY + 5, { align: 'center' });
        doc.text('(Ký tên, đóng dấu)', 150, footerY + 5, { align: 'center' });

        doc.save(`Bao_cao_chi_tiet_${dateFilter.endDate}.pdf`);
        onSuccess('Đã xuất file PDF báo cáo chi tiết chuẩn mẫu');
    } catch (error) {
        console.error("PDF Export Error:", error);
        onError('Quá trình xuất PDF gặp sự cố');
    } finally {
        setLoading(false);
    }
};
