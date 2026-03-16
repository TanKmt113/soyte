import React, { useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AdminLayout from "../components/AdminLayout";
import { Toast } from "@/components/prime";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Button } from "primereact/button";
import { InputSwitch } from "primereact/inputswitch";
import { Dropdown } from "primereact/dropdown";
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';

import { useTemplateForm } from "../hooks/useTemplateForm";
import { InfoBuilder } from "../components/templates/InfoBuilder";
import { PhuLucBuilder } from "../components/templates/PhuLucBuilder";
import { BieuMauBuilder } from "../components/templates/BieuMauBuilder";

const TemplateCreate: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useRef<Toast>(null);
  const [expandedGroups, setExpandedGroups] = useState<Record<number, boolean>>({});

  const {
    template,
    setTemplate,
    loading,
    fetching,
    addGroup,
    updateGroup,
    removeGroup,
    addOption,
    updateOption,
    removeOption,
    addInfoField,
    updateInfoField,
    removeInfoField,
    saveTemplate
  } = useTemplateForm(id);

  const toggleGroup = (index: number) => {
    setExpandedGroups(prev => ({ ...prev, [index]: prev[index] === undefined ? false : !prev[index] }));
  };

  const handleSave = () => {
    if (!template.name || template.name.trim() === "") {
      toast.current?.show({ severity: 'warn', summary: 'Thiếu thông tin', detail: 'Vui lòng nhập tên biểu mẫu' });
      return;
    }

    confirmDialog({
      header: 'Xác nhận lưu biểu mẫu',
      message: 'Bạn có chắc chắn muốn lưu tất cả các nội dung và thiết lập này không?',
      icon: 'pi pi-question-circle',
      acceptLabel: 'Đồng ý lưu',
      acceptClassName: 'p-button-primary px-4 py-2 border-round-lg shadow-1 ml-2 text-white bg-primary-600',
      rejectLabel: 'Quay lại',
      rejectClassName: 'p-button-text text-slate-500 px-4 py-2 border-round-lg',
      accept: async () => {
        try {
          const success = await saveTemplate();
          if (success) {
            toast.current?.show({ severity: 'success', summary: 'Thành công', detail: 'Đã lưu biểu mẫu' });
            setTimeout(() => navigate('/admin/templates'), 1000);
          }
        } catch (err) {
          toast.current?.show({ severity: 'error', summary: 'Lỗi', detail: 'Lỗi khi lưu biểu mẫu' });
        }
      }
    });
  };

  if (fetching) {
    return (
      <AdminLayout title="Đang tải biểu mẫu...">
        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden text-sm flex flex-col animate-pulse min-h-[600px]">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50">
             <div className="h-10 bg-slate-200 rounded-xl mb-6 w-1/3"></div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="h-20 bg-slate-100 rounded-xl"></div>
                <div className="h-20 bg-slate-100 rounded-xl"></div>
             </div>
          </div>
          <div className="p-6 flex-grow">
             <div className="h-64 bg-slate-50 rounded-xl"></div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title={id ? "Chỉnh sửa biểu mẫu" : "Tạo mới biểu mẫu"}>
      <Toast ref={toast} />
      <ConfirmDialog />
      <div className="relative">
        {loading && (
          <div className="absolute inset-0 z-50 rounded-3xl backdrop-blur-[2px] bg-white/65 flex flex-col items-center justify-center gap-4 cursor-not-allowed">
            <div className="bg-white rounded-2xl p-7 md:p-10 shadow-2xl border border-slate-200 flex flex-col items-center gap-3.5">
              <i className="pi pi-spin pi-spinner text-4xl text-primary-600" />
              <div className="text-center">
                <p className="font-bold text-slate-800 text-base">Đang lưu biểu mẫu...</p>
                <p className="text-slate-500 text-xs mt-1">Vui lòng không thao tác trong lúc này</p>
              </div>
            </div>
          </div>
        )}

        <div className={`bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden text-sm flex flex-col${loading ? ' pointer-events-none select-none' : ''}`}>
          
          <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex-shrink-0">
            <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6">
              <div>
                <h3 className="text-primary-900 font-bold text-base">Trạng thái biểu mẫu</h3>
                <p className="text-slate-500 text-xs mt-1">Kích hoạt hoặc vô hiệu hóa biểu mẫu này trên hệ thống</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={template.status ? 'text-green-600 font-bold text-sm' : 'text-slate-400 text-sm font-medium'}>
                  {template.status ? 'Đang hoạt động' : 'Tạm dừng'}
                </span>
                <InputSwitch checked={Boolean(template.status)} onChange={(e) => setTemplate({ ...template, status: e.value })} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-slate-700 font-bold mb-2">Loại biểu mẫu</label>
                <Dropdown
                  value={template.type || 'phuluc'}
                  options={[{ label: 'Phụ lục', value: 'phuluc' }, { label: 'Biểu mẫu', value: 'bieumau' }]}
                  onChange={(e) => setTemplate({ ...template, type: e.value })}
                  className="w-full border-slate-300 focus:border-primary-500 shadow-sm text-base"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-slate-700 font-bold mb-2">Tên biểu mẫu <span className="text-red-500">*</span></label>
                <InputText
                  value={template.name}
                  onChange={(e) => setTemplate({ ...template, name: e.target.value })}
                  className={`w-full bg-white border-slate-300 focus:border-primary-500 shadow-sm p-4 rounded-xl ${!template.name && 'border-orange-200'}`}
                  placeholder="Nhập tên biểu mẫu/phiếu đánh giá..."
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-slate-700 font-bold mb-2">Mô tả (Mục đích, năm, đối tượng...)</label>
                <InputTextarea
                  value={template.description}
                  onChange={(e) => setTemplate({ ...template, description: e.target.value })}
                  rows={2}
                  className="w-full border-slate-300 focus:border-primary-500 shadow-sm p-3 text-base"
                  placeholder="Nhập phụ chú ngắn gọn..."
                />
              </div>
            </div>
          </div>

          <InfoBuilder 
            info={template.info || []}
            updateInfoField={updateInfoField}
            removeInfoField={removeInfoField}
            addInfoField={addInfoField}
            setTemplate={setTemplate}
          />

          <div className="flex-grow p-6 bg-white flex flex-col">
            {template.type === 'phuluc' ? (
              <PhuLucBuilder 
                data={template.data}
                updateGroup={updateGroup}
                removeGroup={removeGroup}
                addOption={addOption}
                updateOption={updateOption}
                removeOption={removeOption}
                expandedGroups={expandedGroups}
                toggleGroup={toggleGroup}
              />
            ) : (
              <BieuMauBuilder 
                data={template.data}
                updateGroup={updateGroup}
                removeGroup={removeGroup}
                addOption={addOption}
                updateOption={updateOption}
                removeOption={removeOption}
                expandedGroups={expandedGroups}
                toggleGroup={toggleGroup}
                setTemplate={setTemplate}
              />
            )}

            <div className="mt-6 mb-2 flex justify-center flex-shrink-0">
              <Button
                label="Thêm nhóm nội dung"
                icon="pi pi-plus"
                onClick={addGroup}
                className="bg-primary-50 text-primary-700 border-dashed border-2 border-primary-300 hover:bg-primary-100 hover:border-primary-500 font-bold px-8 py-3 rounded-xl shadow-sm transition-all"
              />
            </div>
          </div>

          <div className="flex justify-between items-center px-6 py-4 border-t border-slate-200 bg-slate-50 flex-shrink-0">
            <Button
              label="Hủy bỏ & Quay lại"
              icon="pi pi-arrow-left"
              onClick={() => navigate(-1)}
              className="p-button-text text-slate-600 hover:bg-slate-200 font-semibold"
            />
            <Button
              label="Lưu biểu mẫu"
              icon="pi pi-save"
              loading={loading}
              onClick={handleSave}
              className="text-white bg-primary-600 border-primary-600 hover:bg-primary-700 font-bold px-8 py-2.5 rounded-lg shadow-md hover:shadow-lg transition-all"
            />
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default TemplateCreate;
