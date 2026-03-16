import { useState, useEffect, useCallback } from "react";
import { feedBacksSevice } from "../services/feedBacksSevice";
import { FeedbackItem } from "../types/feedbacks";

export const useFeedbacks = (initialRows = 10) => {
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);
  const [lazyParams, setLazyParams] = useState({ first: 0, rows: initialRows, page: 1 });

  const fetchFeedbacks = useCallback(async () => {
    try {
      setLoading(true);
      const response = await feedBacksSevice.fetchFeedBacks(lazyParams.page, lazyParams.rows);
      const data = response.data || response;
      
      let list: FeedbackItem[] = [];
      let total = 0;
      
      if (data?.items && Array.isArray(data.items)) { 
        list = data.items; 
        total = data.total || list.length; 
      } else if (data?.data?.items && Array.isArray(data.data.items)) { 
        list = data.data.items; 
        total = data.data.total || list.length; 
      } else if (Array.isArray(data)) { 
        list = data; 
        total = data.length; 
      }
      
      setFeedbacks(list);
      setTotalRecords(total);
    } catch (error) {
      console.error("Lỗi khi tải danh sách phản hồi:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [lazyParams.page, lazyParams.rows]);

  useEffect(() => {
    fetchFeedbacks();
  }, [fetchFeedbacks]);

  const onPage = (event: any) => {
    setLazyParams({ 
      first: event.first, 
      rows: event.rows, 
      page: event.page + 1 
    });
  };

  return {
    feedbacks,
    loading,
    totalRecords,
    lazyParams,
    onPage,
    refresh: fetchFeedbacks
  };
};
