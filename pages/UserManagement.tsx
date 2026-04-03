import React, { useEffect, useState, useMemo, useRef } from "react";
import { api } from "../api";
import AdminLayout from "../components/AdminLayout";
import UserModal from "../components/UserModal";
import {
  Loader2,
  Search,
  Users,
  UserCheck,
  Plus,
  Shield,
  Edit3,
  Trash2,
  Mail,
} from "lucide-react";
import { Toast } from "primereact/toast";
import { confirmDialog } from "primereact/confirmdialog";
import { Button, Tooltip, InputText } from "@/components/prime";
import { User } from "../types";


const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState("");
  const toast = useRef<Toast>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get("/users");
      const data = response.data || response;
      setUsers(Array.isArray(data) ? data.map((u: any) => ({
        ...u,
        status: Number(u.status) as 0 | 1
      })) : []);
    } catch (err) {
      console.error(err);
      toast.current?.show({
        severity: "error",
        summary: "Lỗi",
        detail: "Không thể tải danh sách người dùng",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDeactivate = async (userId: string | number) => {
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
          await api.updateUser(userId, { status: 0 });
          setUsers(
            users?.map((u) =>
              u.id === userId ? { ...u, status: 0 as 0 | 1 } : u,
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

  const handleResendEmail = async (user: User) => {
    try {
      if (!user.email) return;
      await api.resendVerification(user.email);
      toast.current?.show({
        severity: "success",
        summary: "Thành công",
        detail: "Đã gửi lại email xác thực mật khẩu.",
      });
    } catch (err) {
      toast.current?.show({
        severity: "error",
        summary: "Lỗi",
        detail: "Không thể gửi lại email.",
      });
      console.error(err);
    }
  };

  const handleOpenAddModal = () => {
    setSelectedUser(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (user: User) => {
    setSelectedUser(user);
    setIsModalOpen(true);
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
      active: users.filter((u) => Number(u.status) === 1).length,
      admins: users.filter((u) => u.role === "admin").length,
    }),
    [users],
  );

  return (
    <AdminLayout title="Quản lý Người dùng">
      <Toast ref={toast} />

      <UserModal
        visible={isModalOpen}
        onHide={() => setIsModalOpen(false)}
        user={selectedUser}
        onSaveSuccess={fetchUsers}
      />

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
        <div className="flex flex-col justify-center">
          <Button
            onClick={handleOpenAddModal}
            className="w-full !bg-secondary-600 hover:!bg-secondary-700 text-white font-black py-4 rounded-2xl shadow-xl shadow-secondary-100 flex items-center justify-center gap-2 transition-all transform hover:-translate-y-1 uppercase tracking-widest text-[10px]"
          >
            <Plus size={24} /> THÊM MỚI NGƯỜI DÙNG
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div className="relative w-full">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <InputText
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
                <th className="px-6 py-4">Quyền hạn</th>
                <th className="px-6 py-4">Trạng thái</th>
                <th className="px-6 py-4 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
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
                      <div className="flex flex-wrap gap-1">
                        {(() => {
                          const perms = user.permissions;
                          const permList = !perms
                            ? []
                            : Array.isArray(perms)
                              ? perms.map((p: any) =>
                                  typeof p === "object"
                                    ? p.description || p.name
                                    : p,
                                )
                              : Object.keys(perms);

                          if (permList.length > 0) {
                            return (
                              <>
                                {permList.slice(0, 2).map((perm, idx) => (
                                  <span
                                    key={idx}
                                    className="px-2 py-0.5 bg-primary-50 text-primary-700 border border-primary-100 rounded text-[9px] font-bold whitespace-nowrap uppercase"
                                  >
                                    {perm}
                                  </span>
                                ))}
                                {permList.length > 2 && (
                                  <>
                                    <span
                                      id={`user-perm-${user.id}`}
                                      className="px-2 py-0.5 bg-gray-100 text-gray-600 border border-gray-200 rounded text-[9px] font-bold whitespace-nowrap cursor-help hover:bg-gray-200 transition-colors"
                                    >
                                      +{permList.length - 2}
                                    </span>
                                    <Tooltip
                                      target={`#user-perm-${user.id}`}
                                      content={permList.slice(2).join(", ")}
                                      position="top"
                                      className="text-[10px] font-bold uppercase"
                                    />
                                  </>
                                )}
                              </>
                            );
                          }

                          return (
                            <span className="text-[10px] text-gray-400 italic">
                              Chưa phân quyền
                            </span>
                          );
                        })()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${Number(user.status) === 1
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                          }`}
                      >
                        <div
                          className={`w-1.5 h-1.5 rounded-full ${Number(user.status) === 1 ? "bg-green-500" : "bg-red-500"}`}
                        ></div>
                        {Number(user.status) === 1
                          ? "Hoạt động"
                          : "Vô hiệu hóa"}
                      </span>

                      {user.is_verified === false ? (
                        <span
                          className={`inline-flex ml-2 items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-red-100 text-red-700`}
                        >
                          <div
                            className={`w-1.5 h-1.5 rounded-full bg-red-500`}
                          ></div>

                          Chưa kích hoạt
                        </span>
                      ) : <></>
                      }
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          icon={<Edit3 size={18} />}
                          text
                          rounded
                          className="w-8 h-8"
                          onClick={() => handleOpenEditModal(user)}
                        />
                        {Number(user.status) === 1 && user.is_verified === true && (<Button
                          icon={<Trash2 size={18} />}
                          text
                          rounded
                          severity="danger"
                          className="w-8 h-8"
                          onClick={() => handleDeactivate(user.id)}
                          disabled={Number(user.status) !== 1}
                        />
                        )}
                        {Number(user.status) === 0 && user.is_verified === false && (
                          <Button
                            icon={<Mail size={18} />}
                            text
                            rounded
                            severity="info"
                            className="w-8 h-8"
                            tooltip="Gửi lại mail xác thực"
                            tooltipOptions={{ position: 'top' }}
                            onClick={() => handleResendEmail(user)}
                          />
                        )}
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
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 transition-all transform hover:-translate-y-1">
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
