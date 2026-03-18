import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { feedBacksSevice } from '../services/feedBacksSevice';
import { Toast } from 'primereact/toast';
import { DashboardStats } from '../types/DashboardStats';

export const useFeedbackStats = (type?: string,toastRef?: React.RefObject<Toast | null>) => {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    setStats(null);
  }, [type]);

  const fetchDashboardStats = useCallback(async (payload: { startDate: string, endDate: string }) => {
    try {
      setLoading(true);
      const response = await feedBacksSevice.fetchStats(payload, type);
      const data = response.data?.data || response.data;
      setStats(data);
    } catch (error) {
      console.error("Lỗi lấy thống kê:", error);
      toastRef?.current?.show({
        severity: 'error',
        summary: 'Lỗi',
        detail: 'Không thể tải dữ liệu thống kê từ máy chủ'
      });
    } finally {
      setLoading(false);
    }
  }, [toastRef, type]);

  // Tính toán phần trăm cho biểu đồ
  const totalTiendo = stats && stats.reflect ? (stats.reflect.tiendo.daLam + stats.reflect.tiendo.dangLam + stats.reflect.tiendo.chuaLam) : 0;
  const totalDanhgia = stats && stats.reflect ? (stats.reflect.danhgia.dat + stats.reflect.danhgia.khongDat) : 0;

  // Hàm hỗ trợ tính % và làm tròn
  const getPercent = (value: number, total: number) => {
    return total > 0 ? Math.round((value / total) * 100) + '%' : '0%';
  };

  // Cấu hình dữ liệu cho Biểu đồ Tiến độ
  const tiendoChartData = useMemo(() => {
    if (!stats || !stats.reflect) return { labels: [], datasets: [] };
    const { tiendo } = stats.reflect;
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
    if (!stats || !stats.reflect) return { labels: [], datasets: [] };
    const { danhgia } = stats.reflect;
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

  // Cấu hình cho biểu đồ cột ngang (chỉ dùng cho type evaluate)
  const barChartData = useMemo(() => {
    if (!stats || !stats.evaluate) return { labels: [], datasets: [] };
    const dist = stats.evaluate.ratingDistribution;
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
          backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#f97316', '#ef4444', '#94a3b8'],
          borderRadius: 4
        }
      ]
    };
  }, [stats]);
  
  const getPercentValue = getPercent;

  return {
    stats,
    loading,
    fetchDashboardStats,
    tiendoChartData,
    danhgiaChartData,
    barChartData,
    totalTiendo,
    totalDanhgia,
    getPercentValue
  };
};
