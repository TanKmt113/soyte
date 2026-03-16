export interface FeedbackItem {
  id: string;
  _id?: string;
  name?: string;
  fullName?: string;
  creator_name?: string;
  createdAt?: string;
  created_at?: string;
  date?: string;
  form_id?: string;
  type?: 'phuluc' | 'bieumau';
  info?: Record<string, any>;
  sections?: any[];
}

export interface FeedbackStatsPayload {
  startDate: string;
  endDate: string;
}

export interface FeedbackListResponse {
  items: FeedbackItem[];
  total: number;
}
