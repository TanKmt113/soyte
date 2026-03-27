import { api } from "../api";

export const feedBacksSevice = {
    async fetchFeedBacks(page: number = 1, limit: number = 10, type?: string, survey_key?: string) {
        const params: any = { page, limit, type };
        if (typeof survey_key === 'string' && survey_key !== "") {
            params.survey_key = survey_key;
        }
        return api.get('/feedbacks', params);
    },

    async fetchFeedBackById(id: string) {
        return api.get(`/feedbacks/${id}`);
    },

    async fetchStats(payload: { startDate: string, endDate: string }, type?: string, survey_key?: string) {
        const params: any = { ...payload, type };
        if (typeof survey_key === 'string' && survey_key !== "") {
            params.survey_key = survey_key;
        }
        return api.get('/feedbacks/stats', params);
    },

    async fetchFeedBacksByType(type: string, startDate?: string, endDate?: string) {
        return api.get(`/feedbacks`, { type, startDate, endDate, limit: 1000 });
    },
};