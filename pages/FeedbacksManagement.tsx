import AdminLayout from "../components/AdminLayout";
import React, { useRef, useState, useEffect } from "react";
import { Toast } from "@/components/prime";
import { useParams } from "react-router-dom";
import { getDefaultDates } from "../utils/dateUtils";
import { useFeedbacks } from "../hooks/useFeedbacks";
import { useFeedbackStats } from "../hooks/useFeedbackStats";
import { FeedbackFilters } from "../components/feedbacks/FeedbackFilters";
import { FeedbackStatsSection } from "../components/feedbacks/FeedbackStatsSection";
import { FeedbackDataTable } from "../components/feedbacks/FeedbackDataTable";
import { FeedbackDetailsDialog } from "../components/feedbacks/FeedbackDetailsDialog";

const FeedbacksManagement: React.FC = () => {
  const toast = useRef<Toast>(null);
  const { type } = useParams();

  const [dateFilter, setDateFilter] = useState<{ startDate: string, endDate: string }>(getDefaultDates());
  const [filterType, setFilterType] = useState<string>("this_year");

  const {
    feedbacks,
    loading: feedbacksLoading,
    totalRecords,
    lazyParams,
    selectedFeedback,
    dialogVisible,
    infoLabels,
    onPage,
    viewDetails,
    setDialogVisible
  } = useFeedbacks(type, toast);

  const {
    stats,
    loading: statsLoading,
    fetchDashboardStats,
    tiendoChartData,
    danhgiaChartData,
    barChartData,
    getPercentValue
  } = useFeedbackStats(type, toast);

  const handleFilterChange = (newType: string) => {
    setFilterType(newType);
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

    if (newType === 'this_month') {
      start = new Date(year, now.getMonth(), 1);
      end = new Date(year, now.getMonth() + 1, 0);
    } else if (newType === 'last_month') {
      start = new Date(year, now.getMonth() - 1, 1);
      end = new Date(year, now.getMonth(), 0);
    } else if (newType === 'first_half') {
      start = new Date(year, 0, 1);
      end = new Date(year, 5, 30);
    } else if (newType === 'this_year') {
      start = new Date(year, now.getMonth() - 11, 1);
      end = new Date(year, now.getMonth() + 1, 0);
    } else if (newType === 'second_half') {
      start = new Date(year, 6, 1);
      end = new Date(year, 11, 31);
    } else if (newType === 'custom') {
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

  useEffect(() => {
    fetchDashboardStats(dateFilter);
  }, [dateFilter, type, fetchDashboardStats]);

  return (
    <AdminLayout title="Quản lý góp ý - phản hồi">
      <Toast ref={toast} />

      <FeedbackFilters
        filterType={filterType}
        handleFilterChange={handleFilterChange}
        dateFilter={dateFilter}
        handleCustomDateChange={handleCustomDateChange}
      />

      <FeedbackStatsSection
        type={type}
        stats={stats}
        loading={statsLoading}
        tiendoChartData={tiendoChartData}
        danhgiaChartData={danhgiaChartData}
        barChartData={barChartData}
        getPercentValue={getPercentValue}
      />

      <FeedbackDataTable
        feedbacks={feedbacks}
        loading={feedbacksLoading}
        totalRecords={totalRecords}
        lazyParams={lazyParams}
        onPage={onPage}
        viewDetails={viewDetails}
      />

      <FeedbackDetailsDialog
        dialogVisible={dialogVisible}
        setDialogVisible={setDialogVisible}
        selectedFeedback={selectedFeedback}
        infoLabels={infoLabels}
        type={type}
      />
    </AdminLayout>
  );
};

export default FeedbacksManagement;
