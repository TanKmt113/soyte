import React, { useState, useEffect, useCallback } from 'react';
import { feedBacksSevice } from '../services/feedBacksSevice';
import { formService } from '../services/formService';
import { Toast } from 'primereact/toast';
import { FeedbackItem } from '../types/feedbacks';

export const useFeedbacks = (type?: string, toastRef?: React.RefObject<Toast | null>, surveyKey?: string) => {
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);
  const [lazyParams, setLazyParams] = useState({ first: 0, rows: 10, page: 1 });
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackItem | null>(null);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [infoLabels, setInfoLabels] = useState<Record<string, string>>({});

  const fetchFeedbacks = useCallback(async () => {
    try {
      setLoading(true);
      const response = await feedBacksSevice.fetchFeedBacks(lazyParams.page, lazyParams.rows, type, surveyKey);
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
      toastRef?.current?.show({ severity: 'error', summary: 'Lỗi', detail: 'Không thể tải danh sách phản hồi' });
    } finally {
      setLoading(false);
    }
  }, [lazyParams.page, lazyParams.rows, type, toastRef, surveyKey]);

  useEffect(() => {
    fetchFeedbacks();
  }, [fetchFeedbacks]);

  const onPage = (event: any) => {
    setLazyParams({ first: event.first, rows: event.rows, page: event.page + 1 });
  };

  const viewDetails = async (rowData: FeedbackItem) => {
    try {
      const id = rowData.id || rowData._id;
      if (!id) {
          setSelectedFeedback(rowData);
          setDialogVisible(true);
          return;
      }
      
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
      toastRef?.current?.show({ severity: 'error', summary: 'Lỗi', detail: 'Không thể tải chi tiết phản hồi' });
      setSelectedFeedback(rowData);
      setDialogVisible(true);
    }
  };

  return {
    feedbacks,
    loading,
    totalRecords,
    lazyParams,
    selectedFeedback,
    dialogVisible,
    infoLabels,
    onPage,
    viewDetails,
    setDialogVisible,
    fetchFeedbacks
  };
};
