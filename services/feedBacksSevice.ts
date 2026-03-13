import { api } from "../api";

export const feedBacksSevice = {
    async fetchFeedBacks(page: number = 1, limit: number = 10) {
        return api.get('/feedbacks', { page, limit });
    },

    async fetchFeedBackById(id: string) {
        return api.get(`/feedbacks/${id}`);
    },

    async fetchStats(payload: { startDate: string, endDate: string }) {
        return api.get('/feedbacks/stats', payload);
    },
};