import AdminLayout from "../components/AdminLayout";
import React, { useRef, useState, useEffect, useMemo } from "react";
import { feedBacksSevice } from "../services/feedBacksSevice";
import { Button } from "primereact/button";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Dialog } from "primereact/dialog";
import { Toast, Dropdown, Calendar } from "@/components/prime";
import { formService } from "../services/formService";
import { Chart } from "primereact/chart";
import { DashboardStats } from "../types/DashboardStats";

// ── helpers ───────────────────────────────────────────────────────────────────

/** Resolve info value: handles string, ISO date, {key,value} objects */
const resolveInfoValue = (value: any): string => {
  if (value === null || value === undefined) return "—";
  if (typeof value === "object" && "value" in value) return String(value.value);
  const str = String(value);
  if (/^\d{4}-\d{2}-\d{2}T/.test(str)) {
    try { return new Date(str).toLocaleDateString("vi-VN"); } catch { /* fall through */ }
  }
  return str;
};

/** Extract info entries from numeric keys of the info object */
const parseInfoEntries = (info: Record<string, any>, labels?: Record<string, string>): { label: string; value: string }[] => {
  if (!info || typeof info !== "object") return [];
  return Object.keys(info)
    .filter(k => /^\d+$/.test(k))
    .sort((a, b) => Number(a) - Number(b))
    .map(k => {
      const label = labels && labels[k] ? labels[k] : `Thông tin ${k}`;
      return { label, value: resolveInfoValue(info[k]?.value) };
    });
};

/** Color map for ratingVote */
const RATING_CFG: Record<number, { label: string; bg: string; text: string; dot: string }> = {
  0: { label: "Không dùng", bg: "bg-slate-100", text: "text-slate-400", dot: "bg-slate-300" },
  1: { label: "Rất kém", bg: "bg-red-100", text: "text-red-600", dot: "bg-red-500" },
  2: { label: "Kém", bg: "bg-orange-100", text: "text-orange-600", dot: "bg-orange-500" },
  3: { label: "Trung bình", bg: "bg-yellow-100", text: "text-yellow-700", dot: "bg-yellow-500" },
  4: { label: "Tốt", bg: "bg-blue-100", text: "text-blue-700", dot: "bg-blue-500" },
  5: { label: "Rất tốt", bg: "bg-emerald-100", text: "text-emerald-700", dot: "bg-emerald-500" },
};

const RatingBadge: React.FC<{ value: number }> = ({ value }) => {
  const cfg = RATING_CFG[value] ?? RATING_CFG[0];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
      {value > 0 ? `${value}/5 — ` : ""}{cfg.label}
    </span>
  );
};

// HÀM HỖ TRỢ LẤY NGÀY ĐẦU VÀ CUỐI THÁNG 
const getDefaultDates = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // Tháng trong JS bắt đầu từ 0 (0 = Tháng 1)

  // Ngày đầu tháng: Truyền vào mùng 1
  const firstDay = new Date(year, month, 1);
  // Ngày cuối tháng: Truyền vào ngày 0 của tháng tiếp theo (mẹo nhỏ trong JS)
  const lastDay = new Date(year, month + 1, 0);

  // Hàm fomat ngày sang YYYY-MM-DD
  const formatDate = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  return {
    startDate: formatDate(firstDay),
    endDate: formatDate(lastDay)
  };
};

const formatDateVN = (dateStr: string) => {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
};

// ── main component ─────────────────────────────────────────────────────────────

const FeedbacksManagement: React.FC = () => {
  const toast = useRef<Toast>(null);
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);
  const [lazyParams, setLazyParams] = useState({ first: 0, rows: 10, page: 1 });
  const [selectedFeedback, setSelectedFeedback] = useState<any>(null);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [infoLabels, setInfoLabels] = useState<Record<string, string>>({});
  const [dateFilter, setDateFilter] = useState<{ startDate: string, endDate: string }>(getDefaultDates());
  const [filterType, setFilterType] = useState<string>("this_month");
  const [stats, setStats] = useState<DashboardStats | null>(null);

  const filterOptions = [
    { label: 'Tháng này', value: 'this_month' },
    { label: 'Tháng trước', value: 'last_month' },
    { label: '6 tháng đầu năm', value: 'first_half' },
    { label: '6 tháng cuối năm', value: 'second_half' },
    { label: 'Tùy chọn', value: 'custom' }
  ];

  const handleFilterChange = (type: string) => {
    setFilterType(type);
    const now = new Date();
    const year = now.getFullYear();
    const formatDate = (date: Date) => {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    };

    let start = new Date();
    let end = new Date();

    if (type === 'this_month') {
      start = new Date(year, now.getMonth(), 1);
      end = new Date(year, now.getMonth() + 1, 0);
    } else if (type === 'last_month') {
      start = new Date(year, now.getMonth() - 1, 1);
      end = new Date(year, now.getMonth(), 0);
    } else if (type === 'first_half') {
      start = new Date(year, 0, 1);
      end = new Date(year, 5, 30);
    } else if (type === 'second_half') {
      start = new Date(year, 6, 1);
      end = new Date(year, 11, 31);
    } else if (type === 'custom') {
      // Don't auto-set for custom, keep current or let user pick
      return;
    }

    setDateFilter({
      startDate: formatDate(start),
      endDate: formatDate(end)
    });
  };

  const handleCustomDateChange = (date: Date | null, field: 'startDate' | 'endDate') => {
    if (date) {
      const formatDate = (d: Date) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const d_str = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${d_str}`;
      };

      setDateFilter(prev => ({
        ...prev,
        [field]: formatDate(date)
      }));
    }
  };

  // Hàm gọi API lấy thống kê
  const fetchDashboardStats = async (payload: { startDate: string, endDate: string }) => {
    try {
      const response = await feedBacksSevice.fetchStats(payload);
      const data = response.data?.data || response.data;
      setStats(data);

    } catch (error) {
      console.error("Lỗi lấy thống kê:", error);
      toast.current?.show({
        severity: 'error',
        summary: 'Lỗi',
        detail: 'Không thể tải dữ liệu thống kê từ máy chủ'
      });
    }
  };

  // useEffect này sẽ tự động chạy 1 lần khi load trang và mỗi khi dateFilter thay đổi
  useEffect(() => {
    fetchDashboardStats(dateFilter);
  }, [dateFilter]);

  // Tính toán phần trăm cho biểu đồ
  const totalTiendo = stats ? (stats.phuluc.tiendo.daLam + stats.phuluc.tiendo.dangLam + stats.phuluc.tiendo.chuaLam) : 0;
  const totalDanhgia = stats ? (stats.phuluc.danhgia.dat + stats.phuluc.danhgia.khongDat) : 0;

  // Hàm hỗ trợ tính % và làm tròn
  const getPercent = (value: number, total: number) => {
    return total > 0 ? Math.round((value / total) * 100) + '%' : '0%';
  };

  // Cấu hình dữ liệu cho Biểu đồ Tiến độ
  const tiendoChartData = useMemo(() => {
    if (!stats) return { labels: [], datasets: [] };
    const { tiendo } = stats.phuluc;
    return {
      labels: [
        `Đã làm (${getPercent(tiendo.daLam, totalTiendo)})`,
        `Đang làm (${getPercent(tiendo.dangLam, totalTiendo)})`,
        `Chưa làm (${getPercent(tiendo.chuaLam, totalTiendo)})`
      ],
      datasets: [
        {
          data: [tiendo.daLam, tiendo.dangLam, tiendo.chuaLam],
          backgroundColor: ['#10b981', '#f59e0b', '#ef4444'], // Xanh lá, Vàng, Đỏ
          hoverBackgroundColor: ['#059669', '#d97706', '#dc2626']
        }
      ]
    };
  }, [stats, totalTiendo]);

  // Cấu hình dữ liệu cho Biểu đồ Đánh giá
  const danhgiaChartData = useMemo(() => {
    if (!stats) return { labels: [], datasets: [] };
    const { danhgia } = stats.phuluc;
    return {
      labels: [
        `Đạt (${getPercent(danhgia.dat, totalDanhgia)})`,
        `Không đạt (${getPercent(danhgia.khongDat, totalDanhgia)})`
      ],
      datasets: [
        {
          data: [danhgia.dat, danhgia.khongDat],
          backgroundColor: ['#10b981', '#ef4444'], // Xanh lá, Đỏ
          hoverBackgroundColor: ['#059669', '#dc2626']
        }
      ]
    };
  }, [stats, totalDanhgia]);

  // Tùy chọn chung cho biểu đồ
  const chartOptions = {
    plugins: {
      legend: {
        position: 'right' as const, // Chuyển chú thích sang bên phải (bạn có thể đổi thành 'left' nếu muốn)
        labels: {
          usePointStyle: true, // Đổi hình hộp chữ nhật thành hình tròn cho hiện đại
          padding: 20 // Tăng khoảng cách để chữ dễ nhìn hơn
        }
      }
    },
    cutout: '60%', // Giữ nguyên độ rỗng ở giữa
    maintainAspectRatio: false // Thêm thuộc tính này để biểu đồ không bị thu nhỏ quá mức
  };

  // Cấu hình biểu đồ đường
  const lineChartData = useMemo(() => {
    if (!stats) return { labels: [], datasets: [] };
    return {
      labels: stats.trend.map(t => t.date),
      datasets: [
        {
          label: 'Số lượng phản hồi',
          data: stats.trend.map(t => t.count),
          fill: false,
          borderColor: '#3b82f6', // Màu xanh dương
          tension: 0.4, // Làm cong đường nối
          backgroundColor: '#3b82f6'
        }
      ]
    };
  }, [stats]);

  const lineChartOptions = {
    plugins: { legend: { display: false } }, // Tắt chú thích vì chỉ có 1 đường
    maintainAspectRatio: false,
    scales: {
      y: { beginAtZero: true, ticks: { precision: 0 } } // Trục Y hiển thị số nguyên
    }
  };

  // Cấu hình cho biểu đồ cột ngang
  const barChartData = useMemo(() => {
    if (!stats) return { labels: [], datasets: [] };
    const dist = stats.bieumau.ratingDistribution;
    return {
      labels: ['Rất tốt (5★)', 'Tốt (4★)', 'Trung bình (3★)', 'Kém (2★)', 'Rất kém (1★)', 'Không đánh giá'],
      datasets: [
        {
          label: 'Số lượng đánh giá',
          data: [
            dist.star5,
            dist.star4,
            dist.star3,
            dist.star2,
            dist.star1,
            dist.star0
          ],
          backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#f97316', '#ef4444', '#94a3b8'], // Đổi màu theo từng mức độ
          borderRadius: 4
        }
      ]
    };
  }, [stats]);

  const barChartOptions = {
    indexAxis: 'y' as const, // QUAN TRỌNG: Lật biểu đồ thành cột ngang
    plugins: { legend: { display: false } },
    maintainAspectRatio: false,
    scales: {
      x: { beginAtZero: true, ticks: { precision: 0 } }
    }
  };

  const fetchFeedbacks = async () => {
    try {
      setLoading(true);
      const response = await feedBacksSevice.fetchFeedBacks(lazyParams.page, lazyParams.rows);
      const data = response.data || response;
      let list: any[] = [];
      let total = 0;
      if (data?.items && Array.isArray(data.items)) { list = data.items; total = data.total || list.length; }
      else if (data?.data?.items && Array.isArray(data.data.items)) { list = data.data.items; total = data.data.total || list.length; }
      else if (Array.isArray(data)) { list = data; total = data.length; }
      setFeedbacks(list);
      setTotalRecords(total);
    } catch (error) {
      console.error(error);
      toast.current?.show({ severity: 'error', summary: 'Lỗi', detail: 'Không thể tải danh sách phản hồi' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchFeedbacks(); }, [lazyParams.page, lazyParams.rows]);

  const onPage = (event: any) => setLazyParams({ first: event.first, rows: event.rows, page: event.page + 1 });

  const viewDetails = async (rowData: any) => {
    try {
      const id = rowData.id || rowData._id;
      const response = await feedBacksSevice.fetchFeedBackById(id);
      const data = response.data || response;
      const fbData = data.data || data;
      setSelectedFeedback(fbData);
      setDialogVisible(true);

      // Fetch dynamic labels from the form template
      const formId = fbData.form_id;
      if (formId) {
        try {
          const formRes = await formService.fetchFormById(formId);
          const formData = formRes.data || formRes;
          if (formData?.info && Array.isArray(formData.info)) {
            const labelMap: Record<string, string> = {};
            formData.info.forEach((item: any) => {
              if (item.key !== undefined) {
                labelMap[String(item.key)] = item.title;
              }
            });
            setInfoLabels(labelMap);
          } else {
            setInfoLabels({});
          }
        } catch (err) {
          console.error("Lỗi khi tải thông tin biểu mẫu:", err);
          setInfoLabels({});
        }
      } else {
        setInfoLabels({});
      }
    } catch (error) {
      console.error(error);
      toast.current?.show({ severity: 'error', summary: 'Lỗi', detail: 'Không thể tải chi tiết phản hồi' });
      setSelectedFeedback(rowData);
      setDialogVisible(true);
    }
  };

  const actionBodyTemplate = (rowData: any) => (
    <div className="flex gap-2">
      <Button icon="pi pi-eye" rounded outlined className="w-8 h-8 p-0 text-primary-600 border-primary-600 hover:bg-primary-50" onClick={() => viewDetails(rowData)} title="Xem chi tiết" />
    </div>
  );

  const dateBodyTemplate = (rowData: any) => {
    const d = rowData.createdAt || rowData.created_at || rowData.date;
    if (!d) return "";
    const date = new Date(d);
    return `${date.toLocaleDateString("vi-VN")} ${date.toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' })}`;
  };

  const nameBodyTemplate = (rowData: any) =>
    rowData.name || rowData.fullName || rowData.creator_name || "Không có tên";

  const sttBodyTemplate = (_: any, options: { rowIndex: number }) =>
    options.rowIndex + lazyParams.first + 1;

  // ── render ──────────────────────────────────────────────────────────────────
  return (
    <AdminLayout title="Quản lý góp ý - phản hồi">
      <Toast ref={toast} />

      <div className="flex flex-wrap items-center justify-end gap-3 mb-6 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <Dropdown
          value={filterType}
          options={filterOptions}
          onChange={(e) => handleFilterChange(e.value)}
          className="w-full md:w-[200px] rounded-xl border-primary-600/30 font-medium text-primary-900 bg-white"
          placeholder="Chọn khoảng thời gian"
        />

        {filterType !== 'custom' && (
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl border border-slate-200">
            <i className="pi pi-calendar text-primary-600"></i>
            <span className="text-sm font-semibold text-slate-700">
              {formatDateVN(dateFilter.startDate)} - {formatDateVN(dateFilter.endDate)}
            </span>
          </div>
        )}

        {filterType === 'custom' && (
          <div className="flex flex-wrap items-center gap-4 animate-in fade-in slide-in-from-right-2 duration-300">

            {/* ── Ô TỪ NGÀY ── */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600 whitespace-nowrap">Từ ngày:</span>
              <div className="bg-white border border-slate-300 rounded-md overflow-hidden hover:border-primary-500 focus-within:border-primary-500 focus-within:ring-1 focus-within:ring-primary-200 transition-all w-[140px]">
                <Calendar
                  value={dateFilter.startDate ? new Date(dateFilter.startDate) : null}
                  onChange={(e) => handleCustomDateChange(e.value as Date, 'startDate')}
                  className="w-full"
                  inputClassName="w-full h-9 border-none bg-transparent px-3 text-sm text-slate-700 placeholder:text-slate-400 focus:ring-0 outline-none cursor-pointer"
                  dateFormat="dd/mm/yy"
                  placeholder="dd/mm/yyyy"
                  showIcon
                />
              </div>
            </div>

            {/* ── Ô ĐẾN NGÀY ── */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600 whitespace-nowrap">Đến ngày:</span>
              <div className="bg-white border border-slate-300 rounded-md overflow-hidden hover:border-primary-500 focus-within:border-primary-500 focus-within:ring-1 focus-within:ring-primary-200 transition-all w-[140px]">
                <Calendar
                  value={dateFilter.endDate ? new Date(dateFilter.endDate) : null}
                  onChange={(e) => handleCustomDateChange(e.value as Date, 'endDate')}
                  className="w-full"
                  inputClassName="w-full h-9 border-none bg-transparent px-3 text-sm text-slate-700 placeholder:text-slate-400 focus:ring-0 outline-none cursor-pointer"
                  dateFormat="dd/mm/yy"
                  placeholder="dd/mm/yyyy"
                  showIcon
                />
              </div>
            </div>

          </div>
        )}
      </div>

      {/* ── THỐNG KÊ TỔNG QUAN ──────────────────────────────────────── */}
      {/* ── BIỂU ĐỒ THỐNG KÊ (Chỉ hiện khi có dữ liệu phụ lục) ── */}
      {stats?.phuluc && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
          {/* Biểu đồ Tiến độ */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 flex flex-col transition-transform hover:-translate-y-1 hover:shadow-md">
            <h3 className="text-base font-bold text-primary-900 mb-4">Tỉ lệ Tiến độ thực hiện</h3>

            <div className="w-full max-w-[350px] mx-auto h-[200px] relative">
              <Chart type="doughnut" data={tiendoChartData} options={chartOptions} className="w-full h-full" />
            </div>
          </div>

          {/* Biểu đồ Đánh giá */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 flex flex-col transition-transform hover:-translate-y-1 hover:shadow-md">
            <h3 className="text-base font-bold text-primary-900 mb-4">Tỉ lệ Đánh giá chất lượng</h3>

            <div className="w-full max-w-[350px] mx-auto h-[200px] relative">
              <Chart type="doughnut" data={danhgiaChartData} options={chartOptions} className="w-full h-full" />
            </div>
          </div>
        </div>
      )}
      {/* ── BIỂU ĐỒ XU HƯỚNG VÀ PHÂN BỔ ĐÁNH GIÁ ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">

        {/* Biểu đồ đường: Xu hướng phản hồi */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 transition-transform hover:-translate-y-1 hover:shadow-md flex flex-col">
          <h3 className="text-base font-bold text-primary-900 mb-4">Tổng hợp số lượng phản hồi</h3>
          <div className="w-full h-[250px] relative mt-auto">
            {stats && <Chart type="line" data={lineChartData} options={lineChartOptions} className="w-full h-full" />}
          </div>
        </div>

        {/* Biểu đồ cột ngang: Tổng hợp đánh giá từ Tệ đến Tốt */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 transition-transform hover:-translate-y-1 hover:shadow-md flex flex-col">
          <h3 className="text-base font-bold text-primary-900 mb-4">Tổng hợp mức độ hài lòng</h3>
          <div className="w-full h-[250px] relative mt-auto">
            {stats && <Chart type="bar" data={barChartData} options={barChartOptions} className="w-full h-full" />}
          </div>
        </div>

      </div>
      {/* <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-5 flex items-center gap-4 transition-transform hover:-translate-y-1 hover:shadow-md">
          <div className="w-12 h-12 rounded-full bg-primary-50 flex items-center justify-center text-primary-600 flex-shrink-0">
            <i className="pi pi-comments text-xl"></i>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 mb-0.5">Tổng số ý kiến</p>
            <h3 className="text-2xl font-bold text-primary-900">{stats?.overview.total ?? 0}</h3>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-5 flex items-center gap-4 transition-transform hover:-translate-y-1 hover:shadow-md">
          <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center text-green-600 flex-shrink-0">
            <i className="pi pi-check-circle text-xl"></i>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 mb-0.5">Đã tiếp nhận</p>
            <h3 className="text-2xl font-bold text-slate-800">{stats?.overview.accepted ?? 0}</h3>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-5 flex items-center gap-4 transition-transform hover:-translate-y-1 hover:shadow-md">
          <div className="w-12 h-12 rounded-full bg-yellow-50 flex items-center justify-center text-yellow-600 flex-shrink-0">
            <i className="pi pi-star-fill text-xl"></i>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 mb-0.5">Đánh giá trung bình</p>
            <h3 className="text-2xl font-bold text-slate-800">
              {stats?.overview.averageRating ?? 0} <span className="text-sm font-normal text-slate-500">/ 5</span>
            </h3>
          </div>
        </div>
      </div> */}
      {/* ── LIST TABLE ─────────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden p-6">
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
            <Column header="STT" body={sttBodyTemplate} style={{ width: '5rem' }} />
            <Column header="Người gửi" style={{ width: '15rem' }} body={nameBodyTemplate} />
            <Column header="Ngày gửi" body={dateBodyTemplate} style={{ width: '10rem' }} />
            <Column body={actionBodyTemplate} exportable={false} style={{ width: '5rem' }} header="Thao tác" />
          </DataTable>
        </div>
      </div>

      {/* ── DETAIL DIALOG ──────────────────────────────────────────── */}
      <Dialog
        header="Chi tiết phiếu đã điền"
        visible={dialogVisible}
        style={{ width: '90vw' }}
        maximizable
        onHide={() => setDialogVisible(false)}
        breakpoints={{ '960px': '95vw', '641px': '100vw' }}
        contentClassName="p-0 bg-slate-50"
        headerClassName="bg-white border-b border-slate-200 text-primary-900 font-bold text-xl"
      >
        {selectedFeedback && (
          <div className="flex flex-col h-full text-sm">

            {/* ── TITLE + META STRIP ───────────────────────────────── */}
            <div className="bg-white border-b border-slate-100 px-6 py-4 flex-shrink-0">
              <div className="flex flex-wrap items-start justify-between gap-4 mb-3">
                <h3 className="font-bold text-primary-900 text-base leading-snug">
                  {selectedFeedback.info?.title || "Chi tiết phản hồi"}
                </h3>
                <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
                  <span className="text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                    <span className="font-medium">Ngày gửi:</span>{" "}
                    {selectedFeedback.created_at
                      ? `${new Date(selectedFeedback.created_at).toLocaleDateString("vi-VN")} ${new Date(selectedFeedback.created_at).toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' })}`
                      : "—"}
                  </span>
                  {selectedFeedback.creator_name && (
                    <span className="text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                      <span className="font-medium">Người gửi:</span> {selectedFeedback.creator_name}
                    </span>
                  )}
                  <span className="text-xs font-semibold text-green-700 bg-green-50 px-3 py-1.5 rounded-full border border-green-200">
                    Đã tiếp nhận
                  </span>
                </div>
              </div>

              {selectedFeedback.info?.description && (
                <div className="pt-3 border-t border-slate-50">
                  <p className="text-slate-500 text-xs leading-relaxed italic">
                    {selectedFeedback.info.description}
                  </p>
                </div>
              )}
            </div>

            {/* ── INFO CARDS (dynamic numeric keys) ────────────────── */}
            {selectedFeedback.info && parseInfoEntries(selectedFeedback.info, infoLabels).length > 0 && (
              <div className="px-6 pt-4 pb-3 flex-shrink-0 bg-slate-50 border-b border-slate-100">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {parseInfoEntries(selectedFeedback.info, infoLabels).map((entry, idx) => (
                    <div key={idx} className="bg-white rounded-lg border border-slate-200 px-3 py-2.5 shadow-sm">
                      <span className="block text-[10px] text-slate-400 font-semibold uppercase tracking-wide mb-0.5">{entry.label}</span>
                      <span className="block text-slate-800 font-semibold text-sm break-words">{entry.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── PHỤ LỤC TABLE ────────────────────────────────────── */}
            {selectedFeedback.type === 'phuluc' &&
              selectedFeedback.sections?.length > 0 && (
                <div className="flex-grow px-6 py-5 flex flex-col">
                  <div className="rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <table className="w-full border-collapse text-slate-700 table-fixed">
                      <thead className="bg-primary-800 text-white">
                        <tr>
                          <th rowSpan={2} className="border border-white/30 p-2 w-[4%] text-center align-middle font-bold text-[11px]">STT</th>
                          <th rowSpan={2} className="border border-white/30 p-2 w-[28%] text-center align-middle font-bold text-[11px]">Nội dung thực hiện</th>
                          <th rowSpan={2} className="border border-white/30 p-2 w-[16%] text-center align-middle font-bold text-[11px]">Phương thức thực hiện</th>
                          <th rowSpan={2} className="border border-white/30 p-2 w-[14%] text-center align-middle font-bold text-[11px]">Sản phẩm đầu ra</th>
                          <th colSpan={3} className="border border-white/30 p-1.5 w-[18%] text-center align-middle font-bold text-[11px]">Tiến độ</th>
                          <th colSpan={2} className="border border-white/30 p-1.5 w-[10%] text-center align-middle font-bold text-[11px]">Đánh giá</th>
                          <th rowSpan={2} className="border border-white/30 p-2 w-[10%] text-center align-middle font-bold text-[11px]">Ghi chú</th>
                        </tr>
                        <tr>
                          {/* Các cột con không cần đặt width nữa, trình duyệt sẽ tự động chia đều từ thẻ cha */}
                          <th className="border border-white/30 p-1.5 text-center text-[10px] font-bold leading-tight">Đã làm</th>
                          <th className="border border-white/30 p-1.5 text-center text-[10px] font-bold leading-tight">Đang làm</th>
                          <th className="border border-white/30 p-1.5 text-center text-[10px] font-bold leading-tight">Chưa làm</th>
                          <th className="border border-white/30 p-1.5 text-center text-[10px] font-bold leading-tight">Đạt</th>
                          <th className="border border-white/30 p-1.5 text-center text-[10px] font-bold leading-tight">K.Đạt</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(() => {
                          let globalIdx = 0;
                          const roman = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV'];
                          return selectedFeedback.sections.map((group: any, gi: number) => (
                            <React.Fragment key={gi}>
                              <tr className="bg-primary-800">
                                <td className="p-2.5 text-center">
                                  <span className="inline-flex w-6 h-6 rounded-full bg-white/20 text-white text-xs font-bold items-center justify-center">
                                    {roman[gi] || gi + 1}
                                  </span>
                                </td>
                                <td colSpan={9} className="p-2.5 font-bold text-white text-sm">
                                  {group.name || `Nhóm nội dung ${gi + 1}`}
                                </td>
                              </tr>
                              {group.option && Array.isArray(group.option) && group.option.map((opt: any, oi: number) => {
                                globalIdx++;
                                return (
                                  <tr key={oi} className="hover:bg-slate-50 transition-colors bg-white">
                                    <td className="border border-slate-300 p-2 text-center text-slate-600 font-medium">{globalIdx}</td>
                                    <td className="border border-slate-300 p-3 text-sm leading-relaxed"><div className="whitespace-pre-wrap">{opt.content}</div></td>
                                    <td className="border border-slate-300 p-3 text-sm leading-relaxed"><div className="whitespace-pre-wrap">{opt.method}</div></td>
                                    <td className="border border-slate-300 p-3 text-sm leading-relaxed"><div className="whitespace-pre-wrap">{opt.productOut}</div></td>

                                    <td className="border border-slate-300 p-2 text-center bg-slate-50/30">
                                      <div className="flex justify-center">
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${Number(opt.tiendo) === 1 ? 'bg-primary-600 border-primary-600' : 'bg-white border-slate-300'}`}>
                                          {Number(opt.tiendo) === 1 && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                        </div>
                                      </div>
                                    </td>
                                    <td className="border border-slate-300 p-2 text-center bg-slate-50/30">
                                      <div className="flex justify-center">
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${Number(opt.tiendo) === 2 ? 'bg-primary-600 border-primary-600' : 'bg-white border-slate-300'}`}>
                                          {Number(opt.tiendo) === 2 && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                        </div>
                                      </div>
                                    </td>
                                    <td className="border border-slate-300 p-2 text-center bg-slate-50/30">
                                      <div className="flex justify-center">
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${Number(opt.tiendo) === 3 ? 'bg-primary-600 border-primary-600' : 'bg-white border-slate-300'}`}>
                                          {Number(opt.tiendo) === 3 && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                        </div>
                                      </div>
                                    </td>

                                    <td className="border border-slate-300 p-2 text-center bg-green-50/30">
                                      <div className="flex justify-center">
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${Number(opt.danhgia) === 1 ? 'bg-green-600 border-green-600' : 'bg-white border-slate-300'}`}>
                                          {Number(opt.danhgia) === 1 && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                        </div>
                                      </div>
                                    </td>
                                    <td className="border border-slate-300 p-2 text-center bg-red-50/30">
                                      <div className="flex justify-center">
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${Number(opt.danhgia) === 0 || Number(opt.danhgia) === 2 ? 'bg-red-600 border-red-600' : 'bg-white border-slate-300'}`}>
                                          {(Number(opt.danhgia) === 0 || Number(opt.danhgia) === 2) && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                        </div>
                                      </div>
                                    </td>

                                    <td className="border border-slate-200 p-3 text-sm leading-relaxed"><div className="whitespace-pre-wrap">{opt.ghichu}</div></td>
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

            {/* ── BIỂU MẪU SECTIONS ────────────────────────────────── */}
            {selectedFeedback.type === 'bieumau' &&
              selectedFeedback.sections?.length > 0 && (
                <div className="flex-grow px-6 py-5 flex flex-col gap-4">
                  {(() => {
                    let globalIdx = 0;
                    const roman = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV'];
                    return selectedFeedback.sections.map((section: any, sIdx: number) => (
                      <div key={sIdx} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">

                        {/* Section header - Styled like Phụ lục group */}
                        <div className="bg-primary-800 px-4 py-2.5 flex items-center gap-2">
                          <span className="inline-flex w-6 h-6 rounded-full bg-white/20 text-white text-xs font-bold items-center justify-center flex-shrink-0">
                            {roman[sIdx] || sIdx + 1}
                          </span>
                          <span className="text-white font-semibold text-sm uppercase tracking-wide">
                            {section.name}
                          </span>
                        </div>

                        {/* Questions - Styled numbers like Phụ lục STT */}
                        <div className="divide-y divide-slate-100">
                          {section.option && Array.isArray(section.option) && section.option.map((opt: any, oIdx: number) => {
                            globalIdx++;
                            const rv = opt.ratingVote?.value;
                            const hasRV = rv !== undefined && rv !== null;
                            const aType: string = opt.answerType || "score1_5";
                            const av = opt.answerValue;
                            const hasAv = av !== null && av !== undefined && av !== "" && av !== -1;

                            return (
                              <div key={oIdx} className="px-4 py-3 flex flex-col sm:flex-row sm:items-start gap-4">
                                {/* Number - Continuous numbering like Phụ lục STT */}
                                <span className="flex-shrink-0 w-6 text-center text-slate-500 text-sm font-medium mt-0.5">
                                  {globalIdx}
                                </span>

                                <div className="flex-grow min-w-0">
                                  <p className="text-slate-700 text-sm leading-relaxed">{opt.content}</p>
                                  {opt.note && <p className="text-slate-400 text-xs mt-0.5 italic">Ghi chú: {opt.note}</p>}
                                </div>

                                <div className="flex-shrink-0 flex items-center justify-end min-w-[130px]">
                                  {aType === "score1_5" && hasRV && <RatingBadge value={Number(rv)} />}

                                  {aType === "single_choice" && hasAv && (
                                    <span className="text-xs bg-primary-50 text-primary-800 border border-primary-200 px-2.5 py-1.5 rounded-full font-medium max-w-[220px] text-right break-words">
                                      {String(av)}
                                    </span>
                                  )}

                                  {aType === "percentage" && hasAv && (
                                    <span className="inline-flex items-center gap-1 text-sm font-bold text-primary-700 bg-primary-50 border border-primary-200 px-3 py-1.5 rounded-full">
                                      <i className="pi pi-chart-bar text-xs" />{av}%
                                    </span>
                                  )}

                                  {aType === "text" && hasAv && (
                                    <span className="text-xs text-slate-600 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-lg max-w-[220px] text-right break-words">
                                      {String(av)}
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              )}

            {/* ── FOOTER ───────────────────────────────────────────── */}
            {/* <div className="p-4 border-t border-slate-200 bg-white flex-shrink-0 flex justify-end">
              <Button label="Đóng" icon="pi pi-times" onClick={() => setDialogVisible(false)} className="p-button-outlined border-slate-300 text-slate-700 hover:bg-slate-100 font-bold px-6 py-2" />
            </div> */}

          </div>
        )}
      </Dialog>
    </AdminLayout>
  );
};

export default FeedbacksManagement;
