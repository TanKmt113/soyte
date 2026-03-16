import React, { useRef, useState, useEffect } from "react";
import AdminLayout from "../components/AdminLayout";
import { Toast } from "@/components/prime";
import { feedBacksSevice } from "../services/feedBacksSevice";
import { formService } from "../services/formService";
import { useFeedbacks } from "../hooks/useFeedbacks";
import { useFeedbackStats } from "../hooks/useFeedbackStats";
import { FeedbackFilters } from "../components/feedbacks/FeedbackFilters";
import { FeedbackStatsSection } from "../components/feedbacks/FeedbackStatsSection";
import { FeedbackDataTable } from "../components/feedbacks/FeedbackDataTable";
import { FeedbackDetailsDialog } from "../components/feedbacks/FeedbackDetailsDialog";
import { getDefaultDates, formatDatePayload } from "../utils/dateUtils";
import { FeedbackItem } from "../types/feedbacks";

const FeedbacksManagement: React.FC = () => {
  const toast = useRef<Toast>(null);
  const [dateFilter, setDateFilter] = useState(getDefaultDates());
  const [filterType, setFilterType] = useState<string>("this_month");
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackItem | null>(null);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [infoLabels, setInfoLabels] = useState<Record<string, string>>({});

  const { feedbacks, loading: feedbacksLoading, totalRecords, lazyParams, onPage } = useFeedbacks();
  const { 
    stats, 
    tiendoChartData, 
    danhgiaChartData, 
    lineChartData, 
    barChartData 
  } = useFeedbackStats(dateFilter);

  const handleFilterChange = (type: string) => {
    setFilterType(type);
    const now = new Date();
    const year = now.getFullYear();

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
      return;
    }

    setDateFilter({
      startDate: formatDatePayload(start),
      endDate: formatDatePayload(end)
    });
  };

  const handleCustomDateChange = (date: Date | null, field: 'startDate' | 'endDate') => {
    if (date) {
      setDateFilter(prev => ({
        ...prev,
        [field]: formatDatePayload(date)
      }));
    }
  };

  const viewDetails = async (rowData: FeedbackItem) => {
    try {
      const id = rowData.id || rowData._id;
      if (!id) return;
      
      const response = await feedBacksSevice.fetchFeedBackById(id);
      const data = response.data || response;
      const fbData = data.data || data;
      setSelectedFeedback(fbData);
      setDialogVisible(true);

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

  return (
    <AdminLayout title="Quản lý góp ý - phản hồi">
      <Toast ref={toast} />

      <FeedbackFilters 
        filterType={filterType}
        dateFilter={dateFilter}
        onFilterChange={handleFilterChange}
        onCustomDateChange={handleCustomDateChange}
      />

      <FeedbackStatsSection 
        stats={stats}
        tiendoChartData={tiendoChartData}
        danhgiaChartData={danhgiaChartData}
        lineChartData={lineChartData}
        barChartData={barChartData}
      />

      <FeedbackDataTable 
        feedbacks={feedbacks}
        loading={feedbacksLoading}
        totalRecords={totalRecords}
        lazyParams={lazyParams}
        onPage={onPage}
        onViewDetails={viewDetails}
      />

      <FeedbackDetailsDialog 
        visible={dialogVisible}
        onHide={() => setDialogVisible(false)}
        selectedFeedback={selectedFeedback}
        infoLabels={infoLabels}
      />
    </AdminLayout>
  );
};

export default FeedbacksManagement;
