import AdminLayout from "../components/AdminLayout";
import React, { useRef, useState, useEffect } from "react";
import { feedBacksSevice } from "../services/feedBacksSevice";
import { Button } from "primereact/button";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Toast } from "@/components/prime";

const FeedbacksManagement: React.FC = () => {
  const toast = useRef<Toast>(null);
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);
  const [lazyParams, setLazyParams] = useState({
    first: 0,
    rows: 10,
    page: 1,
  });

  const [selectedFeedback, setSelectedFeedback] = useState<any>(null);
  const [dialogVisible, setDialogVisible] = useState(false);

  const fetchFeedbacks = async () => {
    try {
      setLoading(true);
      const page = lazyParams.page;
      const limit = lazyParams.rows;

      const response = await feedBacksSevice.fetchFeedBacks(page, limit);
      const data = response.data || response;

      let list = [];
      let total = 0;

      if (data && data.items && Array.isArray(data.items)) {
        list = data.items;
        total = data.total || list.length;
      } else if (data && data.data && Array.isArray(data.data.items)) {
        list = data.data.items;
        total = data.data.total || list.length;
      } else if (Array.isArray(data)) {
        list = data;
        total = data.length;
      }

      setFeedbacks(list);
      setTotalRecords(total);
    } catch (error) {
      console.error(error);
      toast.current?.show({ severity: 'error', summary: 'Lỗi', detail: 'Không thể tải danh sách phản hồi' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedbacks();
  }, [lazyParams.page, lazyParams.rows]);

  const onPage = (event: any) => {
    setLazyParams({
      first: event.first,
      rows: event.rows,
      page: event.page + 1
    });
  };

  const viewDetails = async (rowData: any) => {
    try {
      const id = rowData.id || rowData._id;
      const response = await feedBacksSevice.fetchFeedBackById(id);
      const data = response.data || response;
      const detailData = data.data || data; // handle nested data
      setSelectedFeedback(detailData);
      setDialogVisible(true);
    } catch (error) {
      console.error(error);
      toast.current?.show({ severity: 'error', summary: 'Lỗi', detail: 'Không thể tải chi tiết phản hồi' });
      // Fallback to rowData if API fails
      setSelectedFeedback(rowData);
      setDialogVisible(true);
    }
  };

  const actionBodyTemplate = (rowData: any) => {
    return (
      <div className="flex gap-2">
        <Button icon="pi pi-eye" rounded outlined className="w-8 h-8 p-0 text-primary-600 border-primary-600 hover:bg-primary-50" onClick={() => viewDetails(rowData)} title="Xem chi tiết" />
      </div>
    );
  };

  const dateBodyTemplate = (rowData: any) => {
    const dateStr = rowData.createdAt || rowData.created_at || rowData.date;
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('vi-VN');
  }

  const nameBodyTemplate = (rowData: any) => {
    return rowData.name || rowData.fullName || rowData.creator_name || "Không có tên";
  }

  const sttBodyTemplate = (rowData: any, options: { rowIndex: number }) => {
    return options.rowIndex + lazyParams.first + 1;
  };

  return (
    <AdminLayout title="Quản lý góp ý - phản hồi">
      <Toast ref={toast} />
      <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden p-6 relative">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-primary-900">Danh sách ý kiến</h2>
        </div>
        <div className="overflow-x-auto">
          <DataTable
            value={feedbacks}
            loading={loading}
            lazy
            paginator
            first={lazyParams.first}
            rows={lazyParams.rows}
            totalRecords={totalRecords}
            onPage={onPage}
            rowsPerPageOptions={[5, 10, 25, 50]}
            tableStyle={{ minWidth: '50rem' }}
            emptyMessage="Không có dữ liệu phản hồi"
          >
            <Column header="STT" body={sttBodyTemplate} style={{ width: '5rem' }}></Column>
            <Column header="Người gửi" sortable style={{ width: '15rem' }} body={nameBodyTemplate}></Column>
            {/* <Column field="phone" header="Số điện thoại" style={{ width: '10rem' }}></Column>
            <Column field="email" header="Email" style={{ width: '15rem' }}></Column>
            <Column field="title" header="Tiêu đề" body={(row) => row.title || row.subject || '-'}></Column> */}
            <Column header="Ngày gửi" body={dateBodyTemplate} style={{ width: '10rem' }}></Column>
            <Column body={actionBodyTemplate} exportable={false} style={{ width: '5rem' }} header="Thao tác"></Column>
          </DataTable>
        </div>
      </div>

      <Dialog header="Chi tiết phiếu đã điền" visible={dialogVisible} style={{ width: '90vw' }} maximizable onHide={() => setDialogVisible(false)} breakpoints={{ '960px': '95vw', '641px': '100vw' }} contentClassName="p-0 bg-slate-100" headerClassName="bg-white border-b border-slate-200 text-primary-900 font-bold text-xl">
        {selectedFeedback && (
          <div className="bg-white rounded-3xl overflow-hidden text-sm flex flex-col h-full border border-slate-100">

            {/* 1. Trạng thái và Thông tin cơ bản */}
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex-shrink-0">
              <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6">
                <div>
                  <h3 className="text-primary-900 font-bold text-base">Thông tin phản hồi / biểu mẫu</h3>
                  <p className="text-slate-500 text-xs mt-1">Thông tin cơ bản về người gửi và nội dung tiếp nhận</p>
                </div>
                <div className="flex items-center justify-end gap-3 flex-wrap">
                  <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                    <span className="text-slate-500 text-xs font-medium">Ngày gửi:</span>
                    <span className="text-slate-800 text-sm font-bold">
                      {selectedFeedback.createdAt ? new Date(selectedFeedback.createdAt).toLocaleDateString('vi-VN') : (selectedFeedback.created_at ? new Date(selectedFeedback.created_at).toLocaleDateString('vi-VN') : (selectedFeedback.date ? new Date(selectedFeedback.date).toLocaleDateString('vi-VN') : 'Không rõ'))}
                    </span>
                  </div>
                  {selectedFeedback.creator_name && (
                    <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                      <span className="text-slate-500 text-xs font-medium">Tài khoản:</span>
                      <span className="text-slate-800 text-sm font-bold">{selectedFeedback.creator_name}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <span className="text-green-600 font-bold text-sm bg-green-50 px-3 py-1 mt-0.5 rounded-full border border-green-200 inline-block">Đã tiếp nhận</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedFeedback.info && Array.isArray(selectedFeedback.info) && selectedFeedback.info.map((item: any, idx: number) => (
                  <div key={idx} className={item.type === 'textarea' || (item.type === 'text' && (item.value || '').length > 50) ? "md:col-span-2" : "md:col-span-1"}>
                    <label className="block text-slate-700 font-bold mb-2">{item.title}</label>
                    {item.type === 'textarea' || (item.type === 'text' && (item.value || '').length > 50) ? (
                      <InputTextarea readOnly value={item.value || ''} rows={4} className="w-full bg-white border-slate-300 focus:border-primary-500 shadow-sm p-3 text-base text-slate-800" placeholder="Không có thông tin" />
                    ) : (
                      <InputText readOnly value={item.value || ''} className="w-full bg-white border-slate-300 focus:border-primary-500 shadow-sm p-3 text-base font-medium text-slate-800" placeholder="Không có thông tin" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* 3. Chi tiết bảng biểu Phụ Lục (nếu có) */}
            {selectedFeedback.type === 'phuluc' && selectedFeedback.sections && Array.isArray(selectedFeedback.sections) && selectedFeedback.sections.length > 0 && (
              <div className="flex-grow p-6 bg-white flex flex-col">
                <h3 className="text-primary-900 font-bold text-base mb-4">Chi tiết Phụ lục đánh giá</h3>
                <div className="rounded-xl border border-primary-200 overflow-x-auto shadow-sm relative">
                  <table className="w-full border-collapse min-w-max text-slate-700">
                    <thead className="bg-[var(--primary-color,#003159)] text-white">
                      <tr>
                        <th rowSpan={2} className="border border-primary-900 p-3 w-12 text-center align-middle font-semibold bg-primary-800">STT</th>
                        <th rowSpan={2} className="border border-primary-900 p-3 min-w-[200px] text-center align-middle font-semibold bg-primary-800">Nội dung thực hiện</th>
                        <th rowSpan={2} className="border border-primary-900 p-3 min-w-[200px] text-center align-middle font-semibold bg-primary-800">Phương thức thực hiện</th>
                        <th rowSpan={2} className="border border-primary-900 p-3 min-w-[150px] text-center align-middle font-semibold bg-primary-800">Sản phẩm đầu ra</th>
                        <th colSpan={3} className="border border-primary-900 p-2 text-center align-middle font-semibold bg-primary-800">Tiến độ thực hiện</th>
                        <th colSpan={2} className="border border-primary-900 p-2 text-center align-middle font-semibold bg-primary-800">Đánh giá</th>
                        <th rowSpan={2} className="border border-primary-900 p-3 w-32 text-center align-middle font-semibold bg-primary-800">Ghi chú/<br />Kiến nghị</th>
                      </tr>
                      <tr>
                        <th className="border border-primary-900 p-2 w-24 text-center align-middle font-medium text-xs bg-primary-800">Đã thực hiện</th>
                        <th className="border border-primary-900 p-2 w-24 text-center align-middle font-medium text-xs bg-primary-800">Đang thực hiện</th>
                        <th className="border border-primary-900 p-2 w-24 text-center align-middle font-medium text-xs bg-primary-800">Chưa thực hiện</th>
                        <th className="border border-primary-900 p-2 w-20 text-center align-middle font-medium text-xs bg-primary-800">Đạt</th>
                        <th className="border border-primary-900 p-2 w-20 text-center align-middle font-medium text-xs bg-primary-800">Không đạt</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        let globalOptIndex = 0;
                        const romanNumerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV'];

                        return selectedFeedback.sections.map((group: any, groupIndex: number) => (
                          <React.Fragment key={groupIndex}>
                            <tr className="bg-primary-50/60 border-b-2 border-primary-200">
                              <td className="border border-primary-200 p-2 text-center font-bold text-primary-900 text-base">
                                <div className="flex items-center justify-center gap-1">
                                  <i className="pi pi-chevron-down text-primary-700 text-xs mr-1 opacity-70"></i>
                                  <span>{romanNumerals[groupIndex] || groupIndex + 1}</span>
                                </div>
                              </td>
                              <td colSpan={9} className="border border-primary-200 p-2 font-bold text-primary-900 bg-primary-50/60 text-base">
                                {group.name || `Nhóm nội dung ${groupIndex + 1}`}
                              </td>
                            </tr>
                            {group.options && Array.isArray(group.options) && group.options.map((opt: any, optIndex: number) => {
                              globalOptIndex++;
                              return (
                                <tr key={optIndex} className="hover:bg-slate-50 transition-colors">
                                  <td className="border border-slate-200 p-2 text-center text-slate-600 font-medium whitespace-nowrap">
                                    {globalOptIndex}
                                  </td>
                                  <td className="border border-slate-200 p-3 bg-white text-sm">
                                    <div className="whitespace-pre-wrap">{opt.content || ''}</div>
                                  </td>
                                  <td className="border border-slate-200 p-3 bg-white text-sm">
                                    <div className="whitespace-pre-wrap">{opt.method || ''}</div>
                                  </td>
                                  <td className="border border-slate-200 p-3 bg-white text-sm">
                                    <div className="whitespace-pre-wrap">{opt.productOut || ''}</div>
                                  </td>
                                  <td className="border border-slate-200 p-2 text-center align-middle bg-slate-50/50">
                                    <input type="checkbox" readOnly checked={Number(opt.tiendo) === 1} className="w-5 h-5 pointer-events-none opacity-80 accent-primary-600" />
                                  </td>
                                  <td className="border border-slate-200 p-2 text-center align-middle bg-slate-50/50">
                                    <input type="checkbox" readOnly checked={Number(opt.tiendo) === 2} className="w-5 h-5 pointer-events-none opacity-80 accent-primary-600" />
                                  </td>
                                  <td className="border border-slate-200 p-2 text-center align-middle bg-slate-50/50">
                                    <input type="checkbox" readOnly checked={Number(opt.tiendo) === 3} className="w-5 h-5 pointer-events-none opacity-80 accent-primary-600" />
                                  </td>
                                  <td className="border border-slate-200 p-2 text-center align-middle bg-slate-50/30">
                                    <input type="checkbox" readOnly checked={Number(opt.danhgia) === 1} className="w-5 h-5 pointer-events-none opacity-80 accent-green-600" />
                                  </td>
                                  <td className="border border-slate-200 p-2 text-center align-middle bg-slate-50/30">
                                    <input type="checkbox" readOnly checked={Number(opt.danhgia) === 0 || Number(opt.danhgia) === 2} className="w-5 h-5 pointer-events-none opacity-80 accent-red-600" />
                                  </td>
                                  <td className="border border-slate-200 p-2 bg-white">
                                    <div className="w-full text-slate-800 whitespace-pre-wrap text-sm">{opt.ghichu}</div>
                                  </td>
                                </tr>
                              );
                            })}
                          </React.Fragment>
                        ));
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Bottom Actions */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex-shrink-0 flex justify-end gap-3">
              <Button label="Đóng" icon="pi pi-times" onClick={() => setDialogVisible(false)} className="p-button-outlined border-slate-300 text-slate-700 hover:bg-slate-100 font-bold px-6 py-2" />
            </div>

          </div>
        )}
      </Dialog>
    </AdminLayout>
  );
};
export default FeedbacksManagement;
