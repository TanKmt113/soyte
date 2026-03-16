import { useState, useEffect, useMemo, useCallback } from "react";
import { feedBacksSevice } from "../services/feedBacksSevice";
import { DashboardStats } from "../types/DashboardStats";
import { FeedbackStatsPayload } from "../types/feedbacks";

export const useFeedbackStats = (dateFilter: FeedbackStatsPayload) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      const response = await feedBacksSevice.fetchStats(dateFilter);
      const data = response.data?.data || response.data;
      setStats(data);
    } catch (error) {
      console.error("Lỗi lấy thống kê:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [dateFilter]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const getPercent = (value: number, total: number) => {
    return total > 0 ? Math.round((value / total) * 100) + '%' : '0%';
  };

  const tiendoChartData = useMemo(() => {
    if (!stats) return { labels: [], datasets: [] };
    const { tiendo } = stats.phuluc;
    const total = tiendo.daLam + tiendo.dangLam + tiendo.chuaLam;
    return {
      labels: [
        `Đã làm (${getPercent(tiendo.daLam, total)})`,
        `Đang làm (${getPercent(tiendo.dangLam, total)})`,
        `Chưa làm (${getPercent(tiendo.chuaLam, total)})`
      ],
      datasets: [
        {
          data: [tiendo.daLam, tiendo.dangLam, tiendo.chuaLam],
          backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
          hoverBackgroundColor: ['#059669', '#d97706', '#dc2626']
        }
      ]
    };
  }, [stats]);

  const danhgiaChartData = useMemo(() => {
    if (!stats) return { labels: [], datasets: [] };
    const { danhgia } = stats.phuluc;
    const total = danhgia.dat + danhgia.khongDat;
    return {
      labels: [
        `Đạt (${getPercent(danhgia.dat, total)})`,
        `Không đạt (${getPercent(danhgia.khongDat, total)})`
      ],
      datasets: [
        {
          data: [danhgia.dat, danhgia.khongDat],
          backgroundColor: ['#10b981', '#ef4444'],
          hoverBackgroundColor: ['#059669', '#dc2626']
        }
      ]
    };
  }, [stats]);

  const lineChartData = useMemo(() => {
    if (!stats || !stats.trend) return { labels: [], datasets: [] };
    const sortedTrend = [...stats.trend].sort((a, b) => {
      const [d1, m1] = a.date.split('-').map(Number);
      const [d2, m2] = b.date.split('-').map(Number);
      return m1 - m2 || d1 - d2;
    });
    return {
      labels: sortedTrend.map(t => t.date),
      datasets: [
        {
          label: 'Số lượng phản hồi',
          data: sortedTrend.map(t => t.count),
          fill: false,
          borderColor: '#3b82f6',
          tension: 0.4,
          backgroundColor: '#3b82f6'
        }
      ]
    };
  }, [stats]);

  const barChartData = useMemo(() => {
    if (!stats) return { labels: [], datasets: [] };
    const dist = stats.bieumau.ratingDistribution;
    return {
      labels: ['Rất tốt (5★)', 'Tốt (4★)', 'Trung bình (3★)', 'Kém (2★)', 'Rất kém (1★)', 'Không đánh giá'],
      datasets: [
        {
          label: 'Số lượng đánh giá',
          data: [dist.star5, dist.star4, dist.star3, dist.star2, dist.star1, dist.star0],
          backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#f97316', '#ef4444', '#94a3b8'],
          borderRadius: 4
        }
      ]
    };
  }, [stats]);

  return {
    stats,
    loading,
    tiendoChartData,
    danhgiaChartData,
    lineChartData,
    barChartData,
    refresh: fetchStats
  };
};
