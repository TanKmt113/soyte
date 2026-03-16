import React, { useState, useEffect, useRef } from "react";
import {
  FileText,
  Plus,
  Edit3,
  Trash2,
  Search,
  Filter,
  Clock,
  CheckCircle,
  FileEdit,
  Image as ImageIcon,
  Loader2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Delete,
} from "lucide-react";
import { api } from "../api";
import { SERVICE_CATEGORIES_FILTER } from "../constants";
import PostForm from "../components/PostForm";
import AdminLayout from "../components/AdminLayout"; // Import the new layout
import { Dropdown, Button } from "@/components/prime";
import { Toast } from "primereact/toast";
import { confirmDialog } from "primereact/confirmdialog";

const AdminDashboard = () => {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [param, setParam] = useState({
    page: 1,
    limit: 10, // Increased from 2 for better UX
  });
  const [totalPosts, setTotalPosts] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const toast = useRef<Toast>(null);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      let endpoint = `/posts?page=${param.page}&limit=${param.limit}`;
      if (filterCategory !== "all") {
        endpoint += `&category_id=${filterCategory}`;
      }
      if (debouncedSearchTerm) {
        endpoint += `&q=${debouncedSearchTerm}`;
      }
      const response = await api.get(endpoint);
      if (response && response.data && Array.isArray(response.data)) {
        const { data, meta } = response;
        const mapped = data.map((p: any) => ({
          ...p,
          imageUrl: p.image_url,
          createdAt: p.created_at,
          category: p.category_id,
        }));
        setPosts(mapped);
        setTotalPosts(meta.total);
        setTotalPages(Math.ceil(meta.total / param.limit));
      } else {
        setPosts([]);
        setTotalPosts(0);
        setTotalPages(1);
      }
    } catch (error) {
      console.error("Error fetching posts:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error fetching posts",
      });
      setPosts([]);
      setTotalPosts(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300); // Debounce search term

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

  useEffect(() => {
    setParam((p) => ({ ...p, page: 1 }));
  }, [filterCategory, debouncedSearchTerm]);

  useEffect(() => {
    fetchPosts();
  }, [param, filterCategory, debouncedSearchTerm]);

  const handleDelete = async (id: string) => {
    confirmDialog({
      message: "Bạn có chắc chắn muốn xóa bài viết này?",
      header: "Xác nhận",
      icon: Delete,
      accept: async () => {
        try {
          await api.delete(`/posts/${id}`);
          setPosts(posts.filter((p) => p.id !== id));
          toast.current?.show({
            severity: "success",
            summary: "Thành công",
            detail: "Bài viết đã được xóa",
          });
        } catch (error) {
          toast.current?.show({
            severity: "error",
            summary: "Lỗi",
            detail: "Lỗi khi xóa bài viết",
          });
          console.error(error);
        }
      },
    });
  };

  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= totalPages) {
      setParam((p) => ({ ...p, page: newPage }));
    }
  };

  // Client-side filtering is no longer needed as search is server-side.
  const filteredPosts = posts;

  return (
    <AdminLayout title="Bài viết">
      <Toast ref={toast} />
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
            <FileText size={24} />
          </div>
          <div>
            <p className="text-gray-400 text-[10px] font-black uppercase">
              Tổng bài viết
            </p>
            <h3 className="text-2xl font-black text-gray-800">{totalPosts}</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-green-50 text-green-600 rounded-xl flex items-center justify-center">
            <CheckCircle size={24} />
          </div>
          <div>
            <p className="text-gray-400 text-[10px] font-black uppercase">
              Đã xuất bản
            </p>
            <h3 className="text-2xl font-black text-gray-800">{totalPosts}</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
            <FileEdit size={24} />
          </div>
          <div>
            <p className="text-gray-400 text-[10px] font-black uppercase">
              Bản nháp
            </p>
            <h3 className="text-2xl font-black text-gray-800">
              {posts.filter((p) => p.status === "draft").length}
            </h3>
          </div>
        </div>
        <div className="flex flex-col justify-center">
          {/* <Button
            className="w-full !bg-secondary-600 hover:!bg-secondary-700 text-white font-black py-4 rounded-2xl shadow-xl shadow-secondary-100 flex items-center justify-center gap-2 transition-all transform hover:-translate-y-1"
            label="SOẠN BÀI MỚI"
            icon={<Plus size={24} />}
          /> */}

          <Button
            onClick={() => {
              setEditingPost(null);
              setIsFormOpen(true);
            }}
            className="w-full !bg-secondary-600 hover:!bg-secondary-700 text-white font-black py-4 rounded-2xl shadow-xl shadow-secondary-100 flex items-center justify-center gap-2 transition-all transform hover:-translate-y-1"
          >
            <Plus size={24} /> SOẠN BÀI MỚI
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4 bg-gray-50/50">
          <div className="relative w-full md:w-96">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Tìm kiếm bài viết..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-100 font-medium text-sm"
            />
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <Filter className="text-gray-400" size={18} />
            <Dropdown
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              options={SERVICE_CATEGORIES_FILTER}
              optionLabel="title"
              optionValue="id"
              placeholder="Lọc danh mục"
              className="w-full md:w-14rem"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 text-left text-[11px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">
                <th className="px-6 py-4">Bài viết</th>
                <th className="px-6 py-4">Danh mục</th>
                <th className="px-6 py-4">Trạng thái</th>
                <th className="px-6 py-4">Ngày tạo</th>
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
                      Đang tải dữ liệu bài viết...
                    </p>
                  </td>
                </tr>
              ) : (
                filteredPosts.map((post) => {
                  const category = SERVICE_CATEGORIES_FILTER.find(
                    (c) => c.id === post.category,
                  );
                  return (
                    <tr
                      key={post.id}
                      className="hover:bg-gray-50 transition-colors group"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-10 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-200">
                            {post.imageUrl ? (
                              <img
                                src={post.imageUrl}
                                className="w-full h-full object-cover"
                                alt=""
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-300">
                                <ImageIcon size={16} />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-bold text-gray-800 text-sm truncate max-w-xs">
                              {post.title}
                            </h4>
                            <p className="text-[10px] text-gray-400 truncate max-w-xs italic">
                              {post.summary}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[10px] font-black uppercase px-2 py-1 rounded bg-primary-50 text-primary-700 border border-primary-100">
                          {category?.title || post.category || "Tin tức"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${post.status === "published"
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-500"
                            }`}
                        >
                          <div
                            className={`w-1.5 h-1.5 rounded-full ${post.status === "published"
                              ? "bg-green-500"
                              : "bg-gray-400"
                              }`}
                          ></div>
                          {post.status === "published"
                            ? "Công khai"
                            : "Bản nháp"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col text-[11px] text-gray-500 font-medium">
                          <span className="flex items-center gap-1">
                            <Calendar size={12} />{" "}
                            {new Date(post.createdAt).toLocaleDateString(
                              "vi-VN",
                            )}
                          </span>
                          <span className="flex items-center gap-1 mt-0.5">
                            <Clock size={12} />{" "}
                            {new Date(post.createdAt).toLocaleTimeString(
                              "vi-VN",
                              { hour: "2-digit", minute: "2-digit" },
                            )}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            icon={<Edit3 size={18} />}
                            text
                            rounded
                            onClick={() => {
                              setEditingPost(post);
                              setIsFormOpen(true);
                            }}
                          />
                          <Button
                            icon={<Trash2 size={18} />}
                            text
                            rounded
                            severity="danger"
                            onClick={() => handleDelete(post.id)}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
          {!loading && filteredPosts.length === 0 && (
            <div className="py-20 text-center">
              <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                <FileText size={32} />
              </div>
              <p className="text-gray-400 font-bold">
                Không tìm thấy bài viết nào phù hợp.
              </p>
            </div>
          )}
        </div>

        {/* Pagination Controls */}
        <div className="px-6 py-4 border-t border-gray-100 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            Hiển thị <span className="font-bold">{posts.length}</span> trên{" "}
            <span className="font-bold">{totalPosts}</span> kết quả
          </div>
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <Button
                onClick={() => handlePageChange(param.page - 1)}
                disabled={param.page === 1}
                icon={<ChevronLeft size={16} />}
                label="Trước"
                text
              />
              <div className="px-3 py-1 text-sm font-bold">
                {param.page} / {totalPages}
              </div>
              <Button
                onClick={() => handlePageChange(param.page + 1)}
                disabled={param.page === totalPages || totalPages === 0}
                icon={<ChevronRight size={16} />}
                label="Sau"
                iconPos="right"
                text
              />
            </div>
          )}
        </div>
      </div>

      {isFormOpen && (
        <PostForm
          initialData={editingPost}
          onClose={() => setIsFormOpen(false)}
          onSave={() => {
            setIsFormOpen(false);
            fetchPosts();
          }}
        />
      )}
    </AdminLayout>
  );
};

export default AdminDashboard;
