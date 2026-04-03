import React, { useEffect, useState, useRef, useMemo } from "react";
import { api } from "../api";
import { User, Permission } from "../types";
import {
  FACILITIES_BV,
  FACILITIES_TT,
  FACILITIES_BT,
  FACILITIES_TYT,
  FACILITIES_CC,
} from "../constants";
import {
  Users,
  Shield,
  X,
  Save,
  Loader2,
  ChevronRight,
  ChevronDown,
  PlusIcon,
  Edit3Icon,
} from "lucide-react";
import { Toast } from "primereact/toast";
import { Button, InputText, Dropdown } from "@/components/prime";

interface UserModalProps {
  visible: boolean;
  onHide: () => void;
  user: User | null; // null for add mode
  onSaveSuccess: () => void;
}

// Helper to flatten nested permission object back into dot-notation strings
const flattenPermissions = (obj: any): string[] => {
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) return [];
  const result: string[] = [];

  const traverse = (currentObj: any, currentPath: string = "") => {
    for (const key in currentObj) {
      const value = currentObj[key];

      // Handle structural 'children' key
      if (key === "children" && typeof value === "object" && value !== null) {
        traverse(value, currentPath);
        continue;
      }

      const path = currentPath ? `${currentPath}.${key}` : key;

      if (typeof value === "object" && value !== null) {
        // It's a module
        result.push(path);
        // Recurse
        traverse(value, path);
      } else if (key === "view" && value === true) {
        // It's a view action - this matches availablePermissions names like 'posts.view'
        result.push(path);
      }
    }
  };

  traverse(obj);
  return Array.from(new Set(result));
};

// Helper to nest flat dot-notation strings into nested object structure
const nestPermissions = (paths: string[]): any => {
  const result: any = {};
  const actionKeys = [
    "view",
    "create",
    "update",
    "delete",
    "reply",
    "export",
    "update_status",
  ];

  paths.forEach((path) => {
    const parts = path.split(".");
    let current = result;

    parts.forEach((part, index) => {
      // If it's an action key at the end of a path, set it as a boolean
      if (actionKeys.includes(part)) {
        current[part] = true;
        return;
      }

      if (!current[part]) current[part] = {};

      if (index === parts.length - 1) {
        // If it's the last part and not an action key, it's a module.
        // Grant 'view' by default to ensure it shows up in API filters.
        current[part].view = true;
      } else {
        // Prepare for next level
        if (!current[part].children) current[part].children = {};
        current = current[part].children;
      }
    });
  });
  return result;
};

const UserModal: React.FC<UserModalProps> = ({
  visible,
  onHide,
  user,
  onSaveSuccess,
}) => {
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
    permissions: {},
    us: "",
    pass: "",
  });

  const [availablePermissions, setAvailablePermissions] = useState<
    Permission[]
  >([]);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [expandedParents, setExpandedParents] = useState<
    Record<number, boolean>
  >({});
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

        // Use flattener for nested object
        const perms =
          user.permissions && typeof user.permissions === "object"
            ? flattenPermissions(user.permissions)
            : Array.isArray(user.permissions)
              ? user.permissions
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
        setExpandedParents({});
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

      if (accounts.length > 0) {
        setFormData((prev: any) => ({
          ...prev,
          us: accounts[0].username,
          pass: accounts[0].password,
        }));
      }
    } catch (error) {
      console.error("Error fetching email accounts:", error);
    }
  };

  const hierarchicalPermissions = useMemo(() => {
    // Recursive function to filter out granular actions and limit depth
    const filterActionsRecursive = (
      items: Permission[],
      depth = 0,
    ): Permission[] => {
      if (depth >= 2) return []; // Stop at Level 2 (0-indexed: 0=root, 1=child)

      return items
        .filter((p) => {
          const name = p.name.toLowerCase();
          return (
            !name.endsWith(".create") &&
            !name.endsWith(".update") &&
            !name.endsWith(".delete") &&
            !name.endsWith(".reply") &&
            !name.endsWith(".export") &&
            !name.endsWith(".update_status")
          );
        })
        .map((p) => ({
          ...p,
          children: p.children
            ? filterActionsRecursive(p.children, depth + 1)
            : [],
        }));
    };

    // If the API already returns a tree with 'children', use it.
    // Otherwise, build it from parent_id.
    const hasAlreadyNested = availablePermissions.some(
      (p) => p.children && p.children.length > 0,
    );

    if (hasAlreadyNested) {
      const filtered = filterActionsRecursive(availablePermissions);
      // Filter only root nodes (those without parent_id or parent_id not in the list)
      const allIds = new Set(filtered.map((p) => p.id));
      return filtered.filter((p) => !p.parent_id || !allIds.has(p.parent_id));
    }

    // Fallback: build from parent_id if flat
    const map: Record<number, Permission & { children: Permission[] }> = {};
    const filteredFlat = availablePermissions.filter((p) => {
      const name = p.name.toLowerCase();
      return (
        !name.endsWith(".create") &&
        !name.endsWith(".update") &&
        !name.endsWith(".delete") &&
        !name.endsWith(".reply") &&
        !name.endsWith(".export") &&
        !name.endsWith(".update_status")
      );
    });

    filteredFlat.forEach((p) => {
      map[p.id] = { ...p, children: p.children || [] };
    });

    const roots: (Permission & { children: Permission[] })[] = [];
    filteredFlat.forEach((p) => {
      if (p.parent_id && map[p.parent_id]) {
        map[p.parent_id].children.push(map[p.id]);
      } else {
        roots.push(map[p.id]);
      }
    });

    return roots;
  }, [availablePermissions]);

  const handleTogglePermission = (permission: any) => {
    const permissionName = permission.name;
    const isSelected = selectedPermissions.includes(permissionName);

    let newSelected = [...selectedPermissions];

    // Recursive function to get all descendant names (deep)
    const getAllDescendantNames = (p: any): string[] => {
      let names: string[] = [p.name];
      if (p.children && p.children.length > 0) {
        p.children.forEach((child: any) => {
          names = [...names, ...getAllDescendantNames(child)];
        });
      }
      return names;
    };

    // Recursive function to get all ancestor names
    const getAncestorNames = (pName: string): string[] => {
      const p = availablePermissions.find((x) => x.name === pName);
      if (!p || !p.parent_id) return [];

      // Find parent by ID
      const parent = availablePermissions.find((x) => x.id === p.parent_id);
      if (!parent) return [];

      return [parent.name, ...getAncestorNames(parent.name)];
    };

    if (isSelected) {
      // Deselecting: Remove self and ALL descendants
      const descendantsToDeselect = getAllDescendantNames(permission);
      newSelected = newSelected.filter((p) => !descendantsToDeselect.includes(p));
    } else {
      // Selecting: Add self AND ALL descendants
      const descendantsToSelect = getAllDescendantNames(permission);
      newSelected = Array.from(
        new Set([...newSelected, ...descendantsToSelect]),
      );

      // Also ensure all ancestors are selected
      const ancestorsToSelect = getAncestorNames(permissionName);
      newSelected = Array.from(new Set([...newSelected, ...ancestorsToSelect]));

      // Expand if has children
      if (permission.children?.length > 0) {
        setExpandedParents((prev) => ({ ...prev, [permission.id]: true }));
      }
    }

    setSelectedPermissions(newSelected);
  };

  const toggleExpand = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    setExpandedParents((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const getFacilityOptions = (type: string) => {
    switch (type) {
      case "BV":
        return FACILITIES_BV.map((f) => ({ label: f.name, value: f.id }));
      case "TT":
        return FACILITIES_TT.map((f) => ({ label: f.name, value: f.id }));
      case "BT":
        return FACILITIES_BT.map((f) => ({ label: f.name, value: f.id }));
      case "TYT":
        return FACILITIES_TYT.map((f) => ({ label: f.name, value: f.id }));
      case "CC":
        return FACILITIES_CC.map((f) => ({ label: f.name, value: f.id }));
      default:
        return [];
    }
  };

  const handleSave = async () => {
    if (
      !formData.full_name ||
      !formData.email ||
      (!isEdit && !formData.password)
    ) {
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

      // Use nester to build the hierarchical object
      const hierarchicalPermissions =
        formData.role === "user" ? {} : nestPermissions(selectedPermissions);

      const dataToSubmit = {
        ...restOfFormData,
        permissions: hierarchicalPermissions,
      };

      if (isEdit && user) {
        await api.updateUser(user.id, dataToSubmit);
      } else {
        await api.register(dataToSubmit);
      }

      toast.current?.show({
        severity: "success",
        summary: "Thành công",
        detail: isEdit
          ? "Cập nhật người dùng thành công"
          : "Thêm người dùng mới thành công",
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

  const renderPermissionItem = (
    item: Permission,
    level = 0,
  ) => {
    const isSelected = selectedPermissions.includes(item.name);
    const children = item.children || [];
    const hasChildren = children.length > 0;
    // Automatically expand if selected OR if manually expanded
    const isExpanded = !!expandedParents[item.id] || isSelected;

    return (
      <React.Fragment key={item.id}>
        <div
          className={`group flex items-center gap-3 p-3.5 rounded-xl transition-all cursor-pointer border mb-2 ${
            isSelected
              ? "bg-primary-50 border-primary-200 shadow-sm"
              : "bg-white border-gray-100 hover:border-gray-300"
          }`}
          style={{ marginLeft: `${level * 24}px` }}
          onClick={() => handleTogglePermission(item)}
        >
          <div className="flex items-center gap-3 flex-1">
            <div
              className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                isSelected
                  ? "bg-primary-600 border-primary-600 shadow-primary-100 shadow-lg"
                  : "bg-gray-50 border-gray-200 group-hover:border-primary-300"
              }`}
            >
              {isSelected && (
                <div className="w-1.5 h-1.5 bg-white rounded-full animate-in zoom-in-50" />
              )}
            </div>

            <div
              className={`text-[11px] font-black tracking-tight leading-tight uppercase transition-colors ${
                isSelected ? "text-primary-800" : "text-gray-600"
              }`}
            >
              {item.description}
            </div>
          </div>

          {hasChildren && (
            <div className={`transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`}>
              <ChevronDown size={14} className={isSelected ? "text-primary-500" : "text-gray-400"} />
            </div>
          )}
        </div>

        {hasChildren && isExpanded && (
          <div className="animate-in slide-in-from-top-1 fade-in duration-300">
            {children.map((child) =>
              renderPermissionItem(child, level + 1),
            )}
          </div>
        )}
      </React.Fragment>
    );
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <Toast ref={toast} />
      <div
        className={`bg-white w-full ${formData.role === "user" ? "max-w-[40vw]" : "max-w-[60vw]"} rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh] transition-all duration-300`}
      >
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
          <div
            className={`grid grid-cols-1 ${formData.role !== "user" ? "md:grid-cols-2" : ""} gap-8`}
          >
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
                    onChange={(e) =>
                      setFormData({ ...formData, full_name: e.target.value })
                    }
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-100 outline-none font-bold text-gray-700 transition-all font-inter"
                    placeholder="Nhập họ và tên đầy đủ"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-1.5 ml-1">
                    Địa chỉ Email <span className="text-red-500">*</span>
                  </label>
                  <InputText
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    disabled={isEdit}
                    className={`w-full p-3 border border-gray-200 rounded-xl outline-none font-bold transition-all font-inter ${isEdit ? "bg-gray-100 text-gray-400" : "bg-gray-50 text-gray-700 focus:ring-2 focus:ring-primary-100"}`}
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
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-100 outline-none font-bold text-gray-700 transition-all font-inter"
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
                      onChange={(e) =>
                        setFormData({ ...formData, role: e.value })
                      }
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
                        onChange={(e) =>
                          setFormData({ ...formData, status: e.value })
                        }
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
                        onChange={(e) =>
                          setFormData({ ...formData, type: e.value, unit: "" })
                        }
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
                          onChange={(e) =>
                            setFormData({ ...formData, unit: e.value })
                          }
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
                <h4 className="font-black text-gray-800 flex items-center gap-2 border-b border-gray-100 pb-2 uppercase text-sm">
                  <Shield size={18} className="text-primary-600" />
                  PHÂN QUYỀN ({selectedPermissions.length})
                </h4>

                <div className="bg-gray-100 p-5 rounded-3xl border border-gray-200 max-h-[450px] overflow-y-auto custom-scrollbar-thin">
                  {availablePermissions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                      <Loader2 className="animate-spin mb-2" size={24} />
                      <p className="text-[10px] font-black uppercase tracking-widest">
                        Đang kết nối...
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col">
                      {hierarchicalPermissions.map((permission) =>
                        renderPermissionItem(permission),
                      )}
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
            className="flex-1 py-4 border-gray-200 text-gray-500 font-black rounded-2xl hover:bg-white transition-all uppercase tracking-widest text-[11px] shadow-sm"
            outlined
          />
          <Button
            label={isEdit ? "CẬP NHẬT DỮ LIỆU" : "KHỞI TẠO NGƯỜI DÙNG"}
            icon={
              isSaving ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <Save size={18} />
              )
            }
            onClick={handleSave}
            loading={isSaving}
            disabled={isSaving}
            className="flex-1 p-4 bg-primary-600 hover:bg-primary-700 text-white font-black rounded-2xl shadow-xl shadow-primary-200 flex items-center justify-center gap-3 transition-all transform hover:-translate-y-1 active:scale-95 uppercase tracking-widest text-[11px]"
          />
        </div>
      </div>
    </div>
  );
};

export default UserModal;
