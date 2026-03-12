import AdminLayout from "../components/AdminLayout";
import React, { useRef, useState, useEffect } from "react";
import { formService } from "../services/formService";
import { Button } from "primereact/button";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { useNavigate } from "react-router-dom";
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';

import { Toast } from "@/components/prime";
const TemplatesManagement: React.FC = () => {
  const toast = useRef<Toast>(null);
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);
  const [lazyParams, setLazyParams] = useState({
    first: 0,
    rows: 10,
    page: 1,
  });

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const page = lazyParams.page;
      const limit = lazyParams.rows;

      const data = await formService.fetchForms(page, limit);
      // console.log('API Response:', data); // Log the response to debug

      let list = [];
      let total = 0;

      // Extract from 
      if (data && data.data && Array.isArray(data.data.items)) {
        list = data.data.items;
        total = data.data.total || list.length;
      } else if (Array.isArray(data)) {
        list = data;
        total = data.length;
      }

      setTemplates(list);
      setTotalRecords(total);
    } catch (error) {
      console.error(error);
      toast.current?.show({ severity: 'error', summary: 'Lỗi', detail: 'Không thể tải danh sách biểu mẫu' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, [lazyParams.page, lazyParams.rows]); // Re-fetch when page or limit changes

  const onPage = (event: any) => {
    setLazyParams({
      first: event.first,
      rows: event.rows,
      page: event.page + 1 // PrimeReact page is 0-indexed, our API expects 1-indexed
    });
  };

  const handleAddNew = () => {
    navigate('/admin/templates/create');
  }

  const editTemplate = (rowData: any) => {
    const formId = rowData.id || rowData._id;
    navigate(`/admin/templates/edit/${formId}`);
  };

  const confirmDeleteTemplate = (rowData: any) => {
    confirmDialog({
      message: (
        <div className="flex flex-col items-center justify-center text-center pt-4">
          <i className="pi pi-exclamation-circle text-red-500 text-5xl mb-4"></i>
          <p className="text-lg font-bold text-slate-800">Cảnh báo xóa biểu mẫu</p>
          <p className="text-sm text-slate-500 mt-2">
            Bạn có chắc chắn muốn xóa biểu mẫu <span className="font-bold text-primary-600">"{rowData.name || rowData.name}"</span> không?<br />
            Dữ liệu đã xóa sẽ không thể phục hồi.
          </p>
        </div>
      ),
      header: 'Xác nhận xóa',
      icon: 'hidden', // Hide default icon since we use custom one in message
      acceptClassName: 'bg-red-600 border-red-600 hover:bg-red-700 text-white font-bold ml-2',
      rejectClassName: 'p-button-text text-slate-600 hover:bg-slate-100 font-bold',
      acceptLabel: 'Đồng ý xóa',
      rejectLabel: 'Hủy bỏ',
      className: 'w-[400px]',
      accept: async () => {
        try {
          const formId = rowData.id || rowData._id;
          await formService.deleteForm(formId);
          toast.current?.show({ severity: 'success', summary: 'Thành công', detail: `Đã xóa biểu mẫu ${rowData.name || rowData.name}` });
          fetchTemplates(); // Refresh the list
        } catch (error) {
          console.error(error);
          toast.current?.show({ severity: 'error', summary: 'Lỗi', detail: 'Không thể xóa biểu mẫu' });
        }
      },
      reject: () => {
        // Do nothing
      }
    });
  };

  const actionBodyTemplate = (rowData: any) => {
    return (
      <div className="flex gap-2">
        <Button icon="pi pi-pencil" rounded outlined className="w-8 h-8 p-0 text-primary-600 border-primary-600 hover:bg-primary-50" onClick={() => editTemplate(rowData)} />
        <Button icon="pi pi-trash" rounded outlined severity="danger" className="w-8 h-8 p-0 hover:bg-red-50" onClick={() => confirmDeleteTemplate(rowData)} />
      </div>
    );
  };

  const statusBodyTemplate = (rowData: any) => {
    // Determine if active based on string or boolean 'true'
    const isActive = rowData.status === true || rowData.status === 'active' || rowData.status === 'true';

    return (
      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${isActive
        ? 'bg-green-100 text-green-800 border border-green-200'
        : 'bg-slate-100 text-slate-800 border border-slate-200'
        }`}>
        {isActive ? 'Hoạt động' : 'Đang tắt'}
      </span>
    );
  };

  if (templates.length === 0) {
    return (
      <AdminLayout title="Quản lý biểu mẫu">
        <Toast ref={toast} />
        <div className="flex justify-center items-center h-[50vh]">
          <p className="text-slate-500 text-xs">Không có dữ liệu</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Quản lý biểu mẫu">
      <Toast ref={toast} />
      <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden p-6 relative">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-primary-900">Danh sách biểu mẫu</h2>

          <Button
            label="Thêm mới"
            icon="pi pi-plus"
            onClick={handleAddNew}
            className="
              bg-gradient-to-r from-primary-600 to-primary-500 
              border-none text-white 
              px-5 py-2.5 
              rounded-lg 
              shadow-md hover:shadow-lg active:shadow-sm
              transition-all duration-200 ease-in-out
              hover:-translate-y-0.5 
              active:scale-95
              font-semibold tracking-wide
            "
          />
        </div>
        <div className="overflow-x-auto">
          <DataTable
            value={templates}
            loading={loading}
            lazy
            paginator
            first={lazyParams.first}
            rows={lazyParams.rows}
            totalRecords={totalRecords}
            onPage={onPage}
            rowsPerPageOptions={[5, 10, 25, 50]}
            tableStyle={{ minWidth: '50rem' }}
          >
            <Column field="id" header="ID" sortable style={{ width: '5rem' }}></Column>
            <Column field="name" header="Tên biểu mẫu" sortable style={{ width: '20rem' }}></Column>
            <Column field="description" header="Mô tả"></Column>
            <Column field="status" header="Trạng thái" body={statusBodyTemplate} sortable style={{ width: '10rem' }}></Column>
            <Column body={actionBodyTemplate} exportable={false} style={{ width: '8rem' }} header="Thao tác"></Column>
          </DataTable>
        </div>
      </div>
    </AdminLayout>
  );
};
export default TemplatesManagement;
