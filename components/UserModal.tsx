import React, { useEffect, useState, useRef } from "react";
import { api } from "../api";
import { User } from "../types";
import {
  FACILITIES_BV,
  FACILITIES_TT,
  FACILITIES_BT,
  FACILITIES_TYT,
  FACILITIES_CC
} from "../constants";
import {
  Users,
  Shield,
  X,
  Save,
  Loader2,
} from "lucide-react";
import { Toast } from "primereact/toast";
import { Button, InputText, Dropdown } from "@/components/prime";


interface UserModalProps {
  visible: boolean;
  onHide: () => void;
  user: User | null; // null for add mode
  onSaveSuccess: () => void;
}

const UserModal: React.FC<UserModalProps> = ({ visible, onHide, user, onSaveSuccess }) => {
  const toast = useRef<Toast>(null);
  const isEdit = !!user;

  const [formData, setFormData] = useState<any>({
    full_name: "",
    email: "",
    password: "",
    role: "user",
    status: 0,
    type: "",
    unit: "",
    permissions: [],
    us: "",
    pass: "",
  });

  const [availablePermissions, setAvailablePermissions] = useState<any[]>([]);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [emailAccounts, setEmailAccounts] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  useEffect(() => {
    if (visible) {
      fetchPermissions();
      if (!isEdit) fetchEmailAccounts();
      if (isEdit && user) {
        const unit = user.unit || user.facility_id || "";
        let type = user.type || "";

        if (!type && unit) {
          if (FACILITIES_BV.some((f) => f.id === unit)) type = "BV";
          else if (FACILITIES_TT.some((f) => f.id === unit)) type = "TT";
          else if (FACILITIES_BT.some((f) => f.id === unit)) type = "BT";
          else if (FACILITIES_TYT.some((f) => f.id === unit)) type = "TYT";
          else if (FACILITIES_CC.some((f) => f.id === unit)) type = "CC";
        }

        setFormData({
          full_name: user.full_name || "",
          email: user.email || "",
          role: user.role || "user",
          status: Number(user.status) as 0 | 1,
          type: type,
          unit: unit,
          us: user.us || "",
          pass: user.pass || "",
        });
        const perms = Array.isArray(user.permissions)
          ? user.permissions.map((p: any) => typeof p === 'object' ? p.name : p)
          : [];
        setSelectedPermissions(perms);
      } else {
        setFormData({
          full_name: "",
          email: "",
          password: "",
          role: "user",
          status: 0,
          type: "",
          unit: "",
          us: "",
          pass: "",
        });
        setSelectedPermissions([]);
      }
    }
  }, [visible, user]);

  const fetchPermissions = async () => {
    try {
      const response = await api.getPermissions();
      const data = response.permissions || response.data || response;
      setAvailablePermissions(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching permissions:", error);
    }
  };

  const fetchEmailAccounts = async () => {
    try {
      const response = await api.getEmailAccounts();
      const data = response.emailAccounts || response.data || response;
      const accounts = Array.isArray(data) ? data : [];
      setEmailAccounts(accounts);

      // Auto-select first account if present and in Add mode
      if (accounts.length > 0) {
        setFormData(prev => ({
          ...prev,
          us: accounts[0].username,
          pass: accounts[0].password
        }));
      }
    } catch (error) {
      console.error("Error fetching email accounts:", error);
    }
  };

  const handleTogglePermission = (permissionName: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permissionName)
        ? prev.filter((p) => p !== permissionName)
        : [...prev, permissionName],
    );
  };

  const getFacilityOptions = (type: string) => {
    switch (type) {
      case "BV": return FACILITIES_BV.map(f => ({ label: f.name, value: f.id }));
      case "TT": return FACILITIES_TT.map(f => ({ label: f.name, value: f.id }));
      case "BT": return FACILITIES_BT.map(f => ({ label: f.name, value: f.id }));
      case "TYT": return FACILITIES_TYT.map(f => ({ label: f.name, value: f.id }));
      case "CC": return FACILITIES_CC.map(f => ({ label: f.name, value: f.id }));
      default: return [];
    }
  };

  const handleSave = async () => {
    if (!formData.full_name || !formData.email || (!isEdit && !formData.password)) {
      toast.current?.show({
        severity: "warn",
        summary: "Cảnh báo",
        detail: "Vui lòng nhập đầy đủ thông tin bắt buộc",
      });
      return;
    }

    if (formData.role === "user") {
      if (!formData.type || !formData.unit) {
        toast.current?.show({
          severity: "warn",
          summary: "Cảnh báo",
          detail: "Vui lòng chọn Loại hình và Đơn vị công tác",
        });
        return;
      }
    }

    setIsSaving(true);
    try {
      const { ...restOfFormData } = formData;
      const dataToSubmit = {
        ...restOfFormData,
        permissions: formData.role === "user" ? [] : selectedPermissions,
      };

      if (isEdit && user) {
        await api.updateUser(user.id, dataToSubmit);
      } else {
        await api.register(dataToSubmit);
      }

      toast.current?.show({
        severity: "success",
        summary: "Thành công",
        detail: isEdit ? "Cập nhật người dùng thành công" : "Thêm người dùng mới thành công",
      });

      setTimeout(() => {
        onSaveSuccess();
        onHide();
      }, 1000);
    } catch (error) {
      console.error("Error saving user:", error);
      toast.current?.show({
        severity: "error",
        summary: "Lỗi",
        detail: "Không thể lưu thông tin người dùng",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <Toast ref={toast} />
      <div className={`bg-white w-full ${formData.role === 'user' ? 'max-w-[40vw]' : 'max-w-[60vw]'} rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh] transition-all duration-300`}>
        <div className="bg-primary-700 p-4 flex justify-between items-center text-white shrink-0">
          <h3 className="font-bold flex items-center gap-2 text-lg uppercase tracking-tight">
            {isEdit ? <Edit3Icon size={20} /> : <PlusIcon size={20} />}
            {isEdit ? "CẬP NHẬT THÔNG TIN" : "THÊM MỚI NGƯỜI DÙNG"}
          </h3>
          <Button
            icon={<X size={20} />}
            text
            rounded
            onClick={onHide}
            className="!text-white hover:!bg-white/20"
          />
        </div>

        <div className="p-8 overflow-y-auto custom-scrollbar">
          <div className={`grid grid-cols-1 ${formData.role !== 'user' ? 'md:grid-cols-2' : ''} gap-8`}>
            <div className="space-y-6">
              <h4 className="font-black text-gray-800 flex items-center gap-2 border-b border-gray-100 pb-2">
                <Users size={18} className="text-primary-600" />
                THÔNG TIN CƠ BẢN
              </h4>

              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-1.5 ml-1">
                    Họ và tên <span className="text-red-500">*</span>
                  </label>
                  <InputText
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-100 outline-none font-bold text-gray-700 transition-all"
                    placeholder="Nhập họ và tên đầy đủ"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-1.5 ml-1">
                    Địa chỉ Email <span className="text-red-500">*</span>
                  </label>
                  <InputText
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    disabled={isEdit}
                    className={`w-full p-3 border border-gray-200 rounded-xl outline-none font-bold transition-all ${isEdit ? 'bg-gray-100 text-gray-400' : 'bg-gray-50 text-gray-700 focus:ring-2 focus:ring-primary-100'}`}
                    placeholder="example@gmail.com"
                  />
                </div>

                {!isEdit && (
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-1.5 ml-1">
                      Mật khẩu tài khoản <span className="text-red-500">*</span>
                    </label>
                    <InputText
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-100 outline-none font-bold text-gray-700 transition-all"
                      placeholder="••••••••"
                    />
                  </div>
                )}

                <div className={isEdit ? "grid grid-cols-2 gap-4" : "block"}>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-1.5 ml-1">
                      Vai trò hệ thống
                    </label>
                    <Dropdown
                      value={formData.role}
                      options={[
                        { label: "Người dùng", value: "user" },
                        { label: "Quản trị viên", value: "admin" },
                      ]}
                      onChange={(e) => setFormData({ ...formData, role: e.value })}
                      className="w-full !bg-gray-50 !border-gray-200 !rounded-xl outline-none font-bold text-gray-700"
                    />
                  </div>
                  {isEdit && (
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase mb-1.5 ml-1">
                        Trạng thái
                      </label>
                      <Dropdown
                        value={formData.status}
                        options={[
                          { label: "Hoạt động", value: 1 },
                          { label: "Vô hiệu hóa", value: 0 },
                        ]}
                        onChange={(e) => setFormData({ ...formData, status: e.value })}
                        className="w-full !bg-gray-50 !border-gray-200 !rounded-xl outline-none font-bold text-gray-700"
                      />
                    </div>
                  )}
                </div>
                {formData.role === "user" && (
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-4 animate-in slide-in-from-top-2">
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase mb-1.5 ml-1">
                        Loại hình cơ sở <span className="text-red-500">*</span>
                      </label>
                      <Dropdown
                        value={formData.type}
                        options={[
                          { label: "Bệnh viện", value: "BV" },
                          { label: "Trung tâm y tế", value: "TT" },
                          { label: "Bảo trợ xã hội", value: "BT" },
                          { label: "Trạm y tế", value: "TYT" },
                        ]}
                        onChange={(e) => setFormData({ ...formData, type: e.value, unit: "" })}
                        placeholder="-- Chọn loại hình --"
                        className="w-full !bg-white !border-gray-200 !rounded-xl outline-none font-bold text-gray-700"
                      />
                    </div>

                    {formData.type && (
                      <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase mb-1.5 ml-1">
                          Đơn vị công tác <span className="text-red-500">*</span>
                        </label>
                        <Dropdown
                          value={formData.unit}
                          options={getFacilityOptions(formData.type)}
                          onChange={(e) => setFormData({ ...formData, unit: e.value })}
                          placeholder="-- Chọn đơn vị --"
                          filter
                          filterPlaceholder="Tìm kiếm tên đơn vị..."
                          virtualScrollerOptions={{ itemSize: 38 }}
                          className="w-full !bg-white !border-gray-200 !rounded-xl outline-none font-bold text-gray-700"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            {formData.role !== "user" && (
              <div className="space-y-6">
                <h4 className="font-black text-gray-800 flex items-center gap-2 border-b border-gray-100 pb-2 uppercase">
                  <Shield size={18} className="text-primary-600" />
                  PHÂN QUYỀN TRUY CẬP ({selectedPermissions.length})
                </h4>

                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 max-h-[400px] overflow-y-auto custom-scrollbar">
                  {availablePermissions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                      <Loader2 className="animate-spin mb-2" size={24} />
                      <p className="text-xs font-bold uppercase tracking-widest">Đang tải quyền...</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-2">
                      {availablePermissions.map((permission) => (
                        <div
                          key={permission.id}
                          className={`flex items-center gap-3 p-3 rounded-xl transition-all cursor-pointer border ${selectedPermissions.includes(permission.name)
                            ? "bg-primary-50 border-primary-100"
                            : "bg-white border-transparent hover:border-gray-200"
                            }`}
                          onClick={() => handleTogglePermission(permission.name)}
                        >

                          <div className={`text-xs font-black leading-tight ${selectedPermissions.includes(permission.name)
                            ? "text-primary-700"
                            : "text-gray-700"
                            }`}>
                            {permission.description}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 flex gap-4 shrink-0 bg-gray-50/50">
          <Button
            label="HỦY BỎ"
            onClick={onHide}
            className="flex-1 py-3 border-gray-200 text-gray-500 font-black rounded-xl hover:bg-gray-50 transition-all uppercase tracking-widest text-[10px]"
            outlined
          />
          <Button
            label={isEdit ? "CẬP NHẬT" : "LƯU NGƯỜI DÙNG"}
            icon={isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
            onClick={handleSave}
            loading={isSaving}
            disabled={isSaving}
            className="flex-1 p-2 bg-primary-600 hover:bg-primary-700 text-white font-black rounded-xl shadow-lg shadow-primary-200 flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5 uppercase tracking-widest text-[10px]"
          />
        </div>
      </div>
    </div>
  );
};

// Helper icons
const PlusIcon = ({ size }: { size: number }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M12 5v14" /></svg>;
const Edit3Icon = ({ size }: { size: number }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>;

export default UserModal;
