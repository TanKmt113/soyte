import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, AlignmentType, WidthType, BorderStyle, VerticalAlign } from 'docx';
import { saveAs } from 'file-saver';
import { formService } from '@/services/formService';
import { feedBacksSevice } from '@/services/feedBacksSevice';
import { ALL_FACILITIES } from '@/constants';
import { formatDateVN } from '@/utils/dateUtils';
import { FeedbackItem } from '@/types/feedbacks';

export const exportReportToWord = async (
    groupedFeedbacks: Record<string, { title: string, items: FeedbackItem[] }>,
    dateFilter: { startDate: string, endDate: string },
    setLoading: (val: boolean) => void,
    onSuccess: (msg: string) => void,
    onError: (msg: string) => void
) => {
    setLoading(true);
    try {
        const docSections: any[] = [];
        const mainRomanNumerals = ["I", "II", "III", "IV", "V"];

        const formEntries = Object.entries(groupedFeedbacks) as [string, { title: string, items: FeedbackItem[] }][];

        const children: any[] = [];

        // Headers
        const createHeader = () => {
            const now = new Date();
            return new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                borders: {
                    top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                    bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                    left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                    right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                    insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                    insideVertical: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                },
                rows: [
                    new TableRow({
                        children: [
                            new TableCell({
                                width: { size: 40, type: WidthType.PERCENTAGE },
                                children: [
                                    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "SỞ Y TẾ HÀ NỘI", font: "Times New Roman", size: 22 })] }),
                                    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "PHÒNG KIỂM TRA LĨNH VỰC Y TẾ", font: "Times New Roman", size: 22, bold: true })] }),
                                ]
                            }),
                            new TableCell({
                                width: { size: 60, type: WidthType.PERCENTAGE },
                                children: [
                                    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM", font: "Times New Roman", size: 22, bold: true })] }),
                                    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Độc lập - Tự do - Hạnh phúc", font: "Times New Roman", size: 22 })] }),
                                    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "-----------------------", font: "Times New Roman", size: 22 })] }),
                                    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `Hà Nội, ngày ${String(now.getDate()).padStart(2, '0')} tháng ${String(now.getMonth() + 1).padStart(2, '0')} năm ${now.getFullYear()}`, font: "Times New Roman", size: 22, italics: true })] }),
                                ]
                            })
                        ]
                    })
                ]
            });
        };

        // Add Header
        children.push(createHeader());

        // Add Title
        children.push(new Paragraph({ spacing: { before: 400, after: 400 }, alignment: AlignmentType.CENTER, children: [new TextRun({ text: "ĐỀ CƯƠNG BÁO CÁO", font: "Times New Roman", size: 28, bold: true })] }));

        for (let i = 0; i < formEntries.length; i++) {
            const [formId, group] = formEntries[i];
            if (formId === 'unknown') continue;

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

            // Mục lớn
            children.push(new Paragraph({
                spacing: { after: 200 },
                children: [new TextRun({ text: `${mainRomanNumerals[i] || i + 1}. Kết quả triển khai thực hiện báo cáo của ${group.title.toLowerCase()}`, font: "Times New Roman", size: 24, bold: true })]
            }));

            children.push(new Paragraph({
                spacing: { after: 200 },
                children: [new TextRun({ text: `Kết quả tiếp nhận báo cáo (từ ngày ${formatDateVN(dateFilter.startDate)} đến ngày ${formatDateVN(dateFilter.endDate)}).`, font: "Times New Roman", size: 22 })]
            }));

            children.push(new Paragraph({
                spacing: { after: 200 },
                children: [new TextRun({ text: `Tổng số: ${totalUnits} đơn vị.`, font: "Times New Roman", size: 22 })]
            }));

            const mkCell = (text: string, bold = false, align: any = AlignmentType.LEFT, colSpan = 1, rowSpan = 1) => {
                const textRuns = text.split('\n').map((t, idx, arr) => {
                    if (idx < arr.length - 1) return [new TextRun({ text: t, font: "Times New Roman", size: 22, bold }), new TextRun({ break: 1 })];
                    return [new TextRun({ text: t, font: "Times New Roman", size: 22, bold })];
                }).flat();

                return new TableCell({
                    columnSpan: colSpan,
                    rowSpan: rowSpan,
                    margins: { top: 100, bottom: 100, left: 100, right: 100 },
                    verticalAlign: VerticalAlign.CENTER,
                    children: [new Paragraph({ alignment: align, children: textRuns })]
                });
            };

            // Bảng 1
            children.push(new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                rows: [
                    new TableRow({
                        children: [
                            mkCell('STT', true, AlignmentType.CENTER),
                            mkCell('Nội dung', true, AlignmentType.CENTER),
                            mkCell('Số lượng', true, AlignmentType.CENTER),
                            mkCell('Tỷ lệ', true, AlignmentType.CENTER),
                        ]
                    }),
                    new TableRow({ children: [mkCell('1', false, AlignmentType.CENTER), mkCell('Đơn vị báo cáo'), mkCell(String(reportedCount), false, AlignmentType.CENTER), mkCell(totalUnits > 0 ? `${((reportedCount / totalUnits) * 100).toFixed(1)}%` : '0%', false, AlignmentType.CENTER)] }),
                    new TableRow({ children: [mkCell('2', false, AlignmentType.CENTER), mkCell('Đơn vị không báo cáo'), mkCell(String(unReportingCount), false, AlignmentType.CENTER), mkCell(totalUnits > 0 ? `${(unReportingCount / totalUnits * 100).toFixed(1)}%` : '0%', false, AlignmentType.CENTER)] }),
                    new TableRow({ children: [mkCell('3', false, AlignmentType.CENTER), mkCell('Đơn vị báo cáo đúng hạn'), mkCell(String(onTimeCount), false, AlignmentType.CENTER), mkCell(totalUnits > 0 ? `${((onTimeCount / totalUnits) * 100).toFixed(1)}%` : '0%', false, AlignmentType.CENTER)] }),
                    new TableRow({ children: [mkCell('4', false, AlignmentType.CENTER), mkCell('Đơn vị báo cáo không đúng hạn'), mkCell(String(lateCount), false, AlignmentType.CENTER), mkCell(totalUnits > 0 ? `${((lateCount / totalUnits) * 100).toFixed(1)}%` : '0%', false, AlignmentType.CENTER)] }),
                ]
            }));

            children.push(new Paragraph({ spacing: { before: 200, after: 200 }, children: [new TextRun({ text: 'Nhận xét về tỷ lệ đơn vị gửi báo cáo:', font: "Times New Roman", size: 22 })] }));
            children.push(new Paragraph({ spacing: { after: 200 }, children: [new TextRun({ text: '....................................................................................................................................................', font: "Times New Roman", size: 22 })] }));

            children.push(new Paragraph({
                spacing: { after: 200 },
                children: [
                    new TextRun({ text: `Kết quả tổng hợp biểu mẫu đánh giá (theo Phụ lục ${i + 1})`, font: "Times New Roman", size: 22, bold: true }),
                    new TextRun({ break: 1 }),
                    new TextRun({ text: `(Chỉ phân tích trên ${reportedCount} đơn vị gửi báo cáo).`, font: "Times New Roman", size: 22 })
                ]
            }));

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

                    const table2Rows: TableRow[] = [];
                    table2Rows.push(new TableRow({
                        children: [
                            mkCell('STT', true, AlignmentType.CENTER, 1, 2),
                            mkCell('Nội dung kiểm tra', true, AlignmentType.CENTER, 1, 2),
                            mkCell('Phương thức\nthực hiện', true, AlignmentType.CENTER, 1, 2),
                            mkCell('Bằng chứng,\nkết quả', true, AlignmentType.CENTER, 1, 2),
                            mkCell('Tình trạng thực hiện', true, AlignmentType.CENTER, 3)
                        ]
                    }));
                    table2Rows.push(new TableRow({
                        children: [
                            mkCell('Đã thực hiện\n(số đơn vị)', true, AlignmentType.CENTER),
                            mkCell('Đang thực hiện\n(số đơn vị)', true, AlignmentType.CENTER),
                            mkCell('Chưa thực hiện\n(số đơn vị)', true, AlignmentType.CENTER)
                        ]
                    }));

                    const sectionRoman = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
                    let sttCounter = 1;

                    templateSections.forEach((sec: any, si: number) => {
                        let secDaLam = 0, secDangLam = 0, secChuaLam = 0;
                        const optionRows: TableRow[] = [];

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

                            optionRows.push(new TableRow({
                                children: [
                                    mkCell(String(sttCounter++), false, AlignmentType.CENTER),
                                    mkCell(opt.content || ''),
                                    mkCell(opt.method || ''),
                                    mkCell(opt.productOut || ''),
                                    mkCell(daLam ? String(daLam) : '0', false, AlignmentType.CENTER),
                                    mkCell(dangLam ? String(dangLam) : '0', false, AlignmentType.CENTER),
                                    mkCell(chuaLam ? String(chuaLam) : '0', false, AlignmentType.CENTER)
                                ]
                            }));
                        });

                        table2Rows.push(new TableRow({
                            children: [
                                mkCell(sectionRoman[si] || String(si + 1), true, AlignmentType.CENTER),
                                mkCell(sec.name, true, AlignmentType.LEFT, 3),
                                mkCell('', true, AlignmentType.CENTER),
                                mkCell('', true, AlignmentType.CENTER),
                                mkCell('', true, AlignmentType.CENTER)
                            ]
                        }));

                        table2Rows.push(...optionRows);
                    });

                    children.push(new Table({
                        width: { size: 100, type: WidthType.PERCENTAGE },
                        rows: table2Rows
                    }));

                    children.push(new Paragraph({ spacing: { before: 200, after: 200 }, children: [new TextRun({ text: 'Nhận xét về tỷ lệ đơn vị đã thực hiện, đang thực hiện và chưa thực hiện:', font: "Times New Roman", size: 22 })] }));
                    children.push(new Paragraph({ spacing: { after: 400 }, children: [new TextRun({ text: '....................................................................................................................................................', font: "Times New Roman", size: 22 })] }));
                }
            }
        } // End of loop

        // Footer (Chữ ký)
        const footerTable = new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
                top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                insideVertical: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
            },
            rows: [
                new TableRow({
                    children: [
                        new TableCell({
                            width: { size: 50, type: WidthType.PERCENTAGE },
                            children: [
                                new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "NGƯỜI LẬP BIỂU", font: "Times New Roman", size: 22, bold: true })] }),
                                new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "(Ký, ghi rõ họ tên)", font: "Times New Roman", size: 22 })] })
                            ]
                        }),
                        new TableCell({
                            width: { size: 50, type: WidthType.PERCENTAGE },
                            children: [
                                new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "THỦ TRƯỞNG ĐƠN VỊ", font: "Times New Roman", size: 22, bold: true })] }),
                                new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "(Ký tên, đóng dấu)", font: "Times New Roman", size: 22 })] })
                            ]
                        })
                    ]
                })
            ]
        });

        children.push(footerTable);

        docSections.push({
            properties: {},
            children
        });

        const doc = new Document({
            sections: docSections
        });

        const buffer = await Packer.toBlob(doc);
        saveAs(buffer, `Bao_cao_chi_tiet_${dateFilter.endDate}.docx`);

        onSuccess('Đã xuất file Word báo cáo chi tiết chuẩn mẫu');
    } catch (error) {
        console.error("Word Export Error:", error);
        onError('Quá trình xuất Word gặp sự cố');
    } finally {
        setLoading(false);
    }
};
