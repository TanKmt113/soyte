import React, { useEffect, useState, useMemo, useRef } from "react";
import { api } from "../api";
import AdminLayout from "../components/AdminLayout";
import {
  Loader2,
  Search,
  Users,
  UserCheck,
  Shield,
  Edit3,
  Trash2,
  X,
  Save,
} from "lucide-react";
import { Toast } from "primereact/toast";
import { confirmDialog } from "primereact/confirmdialog";
import { Button, InputText, Checkbox } from "@/components/prime";

interface User {
  id: string;
  full_name: string;
  email: string;
  role: "admin" | "user";
  status: "active" | "inactive";
  permissions?: string[];
}

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const toast = useRef<Toast>(null);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [availablePermissions, setAvailablePermissions] = useState<any[]>([]);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get("/users");
      setUsers(response.data || response);
      setError(null);
    } catch (err) {
      setError("Failed to fetch users. Please try again later.");
      console.error(err);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Failed to fetch users.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchPermissions = async () => {
    try {
      const response = await api.getPermissions();
      const data = response.permissions || response.data || response;
      setAvailablePermissions(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching permissions:", error);
    }
  };

  const handleOpenEditModal = (user: User) => {
    setEditingUser({ ...user });
    setSelectedPermissions(user.permissions || []);
    setIsEditModalOpen(true);
    fetchPermissions();
  };

  const handleTogglePermission = (permissionName: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permissionName)
        ? prev.filter((p) => p !== permissionName)
        : [...prev, permissionName],
    );
  };

  const handleSaveUser = async () => {
    if (!editingUser) return;
    setIsSaving(true);
    try {
      await api.updateUser(editingUser.id, {
        full_name: editingUser.full_name,
        role: editingUser.role,
        status: editingUser.status,
        permissions: selectedPermissions,
      });
      toast.current?.show({
        severity: "success",
        summary: "Thành công",
        detail: "Cập nhật thông tin người dùng thành công",
      });
      setIsEditModalOpen(false);
      fetchUsers();
    } catch (error) {
      console.error("Error updating user:", error);
      toast.current?.show({
        severity: "error",
        summary: "Lỗi",
        detail: "Không thể cập nhật thông tin người dùng",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeactivate = async (userId: string) => {
    confirmDialog({
      message: "Bạn có chắc chắn muốn vô hiệu hóa người dùng này?",
      header: "Xác nhận",
      icon: "pi pi-exclamation-triangle",
      acceptLabel: "XÁC NHẬN",
      rejectLabel: "HỦY BỎ",
      acceptClassName: "!bg-red-600 !border-red-600 hover:!bg-red-700 !px-6 !py-2.5 !rounded-xl !font-black !text-white !shadow-lg !shadow-red-100 !transition-all !transform hover:!-translate-y-0.5",
      rejectClassName: "!text-gray-600 hover:!bg-gray-50 !px-6 !py-2.5 !rounded-xl !font-black !border-none !transition-all",
      accept: async () => {
        try {
          await api.updateUser(userId, { status: "inactive" });
          setUsers(
            users?.map((u) =>
              u.id === userId ? { ...u, status: "inactive" } : u,
            ),
          );
          toast.current?.show({
            severity: "success",
            summary: "Thành công",
            detail: "Đã vô hiệu hóa người dùng",
          });
        } catch (err) {
          toast.current?.show({
            severity: "error",
            summary: "Lỗi",
            detail: "Không thể vô hiệu hóa người dùng.",
          });
          console.error(err);
        }
      },
    });
  };

  const filteredUsers = useMemo(
    () =>
      users.filter(
        (user) =>
          user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email?.toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    [users, searchTerm],
  );

  const stats = useMemo(
    () => ({
      total: users.length,
      active: users.filter((u) => parseInt(u.status as any) === 1 || u.status === "active").length,
      admins: users.filter((u) => u.role === "admin").length,
    }),
    [users],
  );

  return (
    <AdminLayout title="Quản lý Người dùng">
      <Toast ref={toast} />
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-4">
        <StatCard
          icon={Users}
          title="Tổng số người dùng"
          value={stats.total}
          color="blue"
        />
        <StatCard
          icon={UserCheck}
          title="Đang hoạt động"
          value={stats.active}
          color="green"
        />
        <StatCard
          icon={Shield}
          title="Quản trị viên"
          value={stats.admins}
          color="amber"
        />
      </div>

      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div className="relative w-full md:w-96">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên hoặc email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-100 font-medium text-sm"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 text-left text-[11px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">
                <th className="px-6 py-4">Tên người dùng</th>
                <th className="px-6 py-4">Vai trò</th>
                <th className="px-6 py-4">Trạng thái</th>
                <th className="px-6 py-4 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-20 text-center">
                    <Loader2
                      size={40}
                      className="animate-spin text-primary-600 mx-auto mb-4"
                    />
                    <p className="text-gray-400 font-bold uppercase text-[10px]">
                      Đang tải dữ liệu người dùng...
                    </p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-800 text-sm">
                        {user.full_name}
                      </div>
                      <div className="text-xs text-gray-500">{user.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-[10px] font-black uppercase px-2 py-1 rounded border ${user.role === "admin"
                          ? "bg-amber-50 text-amber-700 border-amber-100"
                          : "bg-gray-50 text-gray-600 border-gray-100"
                          }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${parseInt(user.status as any) === 1 || user.status === 'active'
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                          }`}
                      >
                        <div
                          className={`w-1.5 h-1.5 rounded-full ${parseInt(user.status as any) === 1 || user.status === 'active' ? "bg-green-500" : "bg-red-500"}`}
                        ></div>
                        {parseInt(user.status as any) === 1 || user.status === 'active'
                          ? "Hoạt động"
                          : "Vô hiệu hóa"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          icon={<Edit3 size={18} />}
                          text
                          rounded
                          onClick={() => handleOpenEditModal(user)}
                        />
                        <Button
                          icon={<Trash2 size={18} />}
                          text
                          rounded
                          severity="danger"
                          onClick={() => handleDeactivate(user.id)}
                          disabled={parseInt(user.status as any) !== 1 && user.status !== 'active'}
                        />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {!loading && filteredUsers.length === 0 && (
            <div className="py-20 text-center">
              <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                <Users size={32} />
              </div>
              <p className="text-gray-400 font-bold">
                {searchTerm
                  ? "Không tìm thấy người dùng nào phù hợp."
                  : "Không có người dùng nào trong hệ thống."}
              </p>
            </div>
          )}
        </div>
      </div>

      {isEditModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-primary-700 p-4 flex justify-between items-center text-white">
              <h3 className="font-bold flex items-center gap-2 text-lg">
                <Edit3 size={20} />
                CHỈNH SỬA NGƯỜI DÙNG
              </h3>
              <Button
                icon={<X size={20} />}
                text
                rounded
                onClick={() => setIsEditModalOpen(false)}
                className="!text-white hover:!bg-white/20"
              />
            </div>

            <div className="p-6 overflow-y-auto max-h-[80vh]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-black text-gray-800 flex items-center gap-2 border-b border-gray-100 pb-2 mb-4">
                    <Users size={18} className="text-primary-600" />
                    THÔNG TIN CƠ BẢN
                  </h4>

                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">
                      Họ và tên
                    </label>
                    <InputText
                      value={editingUser?.full_name || ""}
                      onChange={(e) =>
                        setEditingUser({
                          ...editingUser,
                          full_name: e.target.value,
                        })
                      }
                      className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-100 outline-none font-bold text-gray-700"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">
                      Email
                    </label>
                    <InputText
                      value={editingUser?.email || ""}
                      disabled
                      className="w-full p-2.5 bg-gray-100 border border-gray-200 rounded-xl font-bold text-gray-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">
                      Vai trò
                    </label>
                    <select
                      value={editingUser?.role || "user"}
                      onChange={(e) =>
                        setEditingUser({
                          ...editingUser,
                          role: e.target.value,
                        })
                      }
                      className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-100 outline-none font-bold text-gray-700"
                    >
                      <option value="user">Người dùng</option>
                      <option value="admin">Quản trị viên</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-black text-gray-800 flex items-center gap-2 border-b border-gray-100 pb-2 mb-4">
                    <Shield size={18} className="text-primary-600" />
                    PHÂN QUYỀN TRUY CẬP
                  </h4>

                  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 max-h-60 overflow-y-auto">
                    {availablePermissions.length === 0 ? (
                      <p className="text-xs text-center text-gray-400 py-4">
                        Đang tải danh sách quyền...
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 gap-2">
                        {availablePermissions.map((permission) => (
                          <div
                            key={permission.id}
                            className="flex items-center gap-3 p-2 hover:bg-white rounded-lg transition-colors cursor-pointer group"
                            onClick={() =>
                              handleTogglePermission(permission.name)
                            }
                          >
                            <Checkbox
                              checked={selectedPermissions.includes(
                                permission.name,
                              )}
                              onChange={() =>
                                handleTogglePermission(permission.name)
                              }
                            />
                            <div>
                              <p className="text-xs font-bold text-gray-700 group-hover:text-primary-600">
                                {permission.name}
                              </p>
                              {permission.description && (
                                <p className="text-[10px] text-gray-400 line-clamp-1">
                                  {permission.description}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-100 flex gap-4">
                <Button
                  label="HỦY BỎ"
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 py-3 border-gray-200 text-gray-500 font-black rounded-xl hover:bg-gray-50 transition-all"
                  outlined
                />
                <Button
                  label="CẬP NHẬT THÔNG TIN"
                  icon={<Save size={20} />}
                  onClick={handleSaveUser}
                  loading={isSaving}
                  disabled={isSaving}
                  className="flex-1 px-2 py-3 bg-primary-600 hover:bg-primary-700 text-white font-black rounded-xl shadow-lg shadow-primary-100 flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

interface StatCardProps {
  icon: React.ElementType;
  title: string;
  value: number | string;
  color: "blue" | "green" | "amber";
}

const StatCard: React.FC<StatCardProps> = ({
  icon: Icon,
  title,
  value,
  color,
}) => {
  const colors = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    amber: "bg-amber-50 text-amber-600",
  };
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
      <div
        className={`w-12 h-12 ${colors[color]} rounded-xl flex items-center justify-center`}
      >
        <Icon size={24} />
      </div>
      <div>
        <p className="text-gray-400 text-[10px] font-black uppercase">
          {title}
        </p>
        <h3 className="text-2xl font-black text-gray-800">{value}</h3>
      </div>
    </div>
  );
};

export default UserManagement;
