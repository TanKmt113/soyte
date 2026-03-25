import { jsPDF } from "jspdf"
import autoTable from 'jspdf-autotable'
import { TIMES_REGULAR_BASE64, TIMES_BOLD_BASE64 } from '@/utils/pdfFonts'
import { formatDateVN } from '@/utils/dateUtils'
import { FeedbackItem } from '@/types/feedbacks'
import { calculateTotalUnits, calculateOnTimeStats } from '@/utils/reportDataUtils'

export const exportReportToPDF = async (
    groupedFeedbacks: Record<string, { title: string, items: FeedbackItem[] }>,
    formTemplates: Record<string, any>,
    facilities: any[],
    dateFilter: { startDate: string, endDate: string },
    setLoading: (val: boolean) => void,
    onSuccess: (msg: string) => void,
    onError: (msg: string) => void
) => {
    setLoading(true);
    try {
        const doc = new jsPDF();

        // ... existing font setup ...
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
        const mainRomanNumerals = ["I", "II", "III", "IV", "V"];

        // --- Duyệt qua từng nhóm để vẽ nội dung ---
        const formEntries = Object.entries(groupedFeedbacks) as [string, { title: string, items: FeedbackItem[] }][];

        for (let i = 0; i < formEntries.length; i++) {
            const [formId, group] = formEntries[i];
            if (formId === 'unknown') continue;

            // Sử dụng template đã truyền vào từ báo cáo, không gọi API nữa
            const formTemplate = formTemplates[formId];
            if (!formTemplate) continue;

            const totalUnits = calculateTotalUnits(formTemplate, facilities);
            const reportedCount = group.items.length;
            const unReportingCount = Math.max(0, totalUnits - reportedCount);
            const { onTimeCount, lateCount } = calculateOnTimeStats(group.items, formTemplate);

            if (currentY > 240) { doc.addPage(); currentY = 20; }

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
                // Sử dụng dữ liệu group.items đã có sẵn chi tiết (sections), không gọi lại fetchById
                const detailedFeedbacks = group.items;


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

                    if (currentY > 230) { doc.addPage(); currentY = 20; }

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

        // --- Phụ lục: Danh sách đơn vị tham gia báo cáo ---
        doc.addPage();
        currentY = 20;

        doc.setFontSize(14);
        doc.setFont(FONT, 'bold');
        doc.text('PHỤ LỤC', 105, currentY, { align: 'center' });
        currentY += 7;
        doc.setFontSize(11);
        doc.setFont(FONT, 'normal');
        doc.text('Danh sách các đơn vị đã gửi báo cáo', 105, currentY, { align: 'center' });
        currentY += 10;

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
                    const facility = (facilities || []).find((f: any) => String(f.id) === String(key));
                    if (facility) return facility.name;
                }
                const firstMatchedField = Object.entries(item.info)
                    .filter(([k]) => !isNaN(Number(k)))
                    .find(([_, v]: [string, any]) => v?.value?.key && v?.value?.value);
                if (firstMatchedField) return String((firstMatchedField[1] as any).value.value);
            }
            return item.fullName || item.name || 'Chưa xác định';
        };

        const appendixRoman = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
        const appendixBody: any[] = [];
        const sortedEntries = Object.entries(groupedFeedbacks).sort((a, b) => {
            const order: Record<string, number> = { "3": 1, "17": 2, "18": 3 };
            return (order[a[0]] || 99) - (order[b[0]] || 99);
        });

        sortedEntries.forEach(([formId, group]: [string, any], gi) => {
            appendixBody.push([
                { content: appendixRoman[gi] || gi + 1, styles: { halign: 'center', fontStyle: 'bold', fillColor: [240, 240, 240] } },
                { content: group.title, styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } }
            ]);
            group.items.forEach((fb: any, ii: number) => {
                appendixBody.push([
                    { content: ii + 1, styles: { halign: 'center' } },
                    getUnitName(fb)
                ]);
            });
        });

        autoTable(doc, {
            startY: currentY,
            head: [['STT', 'Tên đơn vị báo cáo']],
            body: appendixBody,
            styles: { font: FONT, fontSize: 11, textColor: [0, 0, 0], lineColor: [0, 0, 0], lineWidth: 0.1 },
            headStyles: { font: FONT, fontStyle: 'bold', fillColor: [255, 255, 255], textColor: [0, 0, 0], halign: 'center' },
            columnStyles: { 0: { halign: 'center', cellWidth: 20 } },
            theme: 'grid'
        });

        currentY = (doc as any).lastAutoTable.finalY + 15;

        // --- Footer: Chữ ký cuối cùng ---
        if (currentY > 230) { doc.addPage(); currentY = 20; }
        const footerY = currentY + 15;
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
