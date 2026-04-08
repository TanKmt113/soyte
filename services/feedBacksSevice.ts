import { api } from "../api";

export const feedBacksSevice = {
    async fetchFeedBacks(page: number = 1, limit: number = 10, type?: string, survey_key?: string | string[]) {
        const params: any = { page, limit, type };
        if (Array.isArray(survey_key) && survey_key.length > 0) {
            params.survey_key = survey_key.join(',');
        } else if (typeof survey_key === 'string' && survey_key !== "") {
            params.survey_key = survey_key;
        }
        return api.get('/feedbacks', params);
    },

    async fetchFeedBackById(id: string) {
        return api.get(`/feedbacks/${id}`);
    },

    async fetchStats(payload: { startDate: string, endDate: string }, type?: string, survey_key?: string | string[]) {
        const params: any = { ...payload, type };
        if (Array.isArray(survey_key) && survey_key.length > 0) {
            params.survey_key = survey_key.join(',');
        } else if (typeof survey_key === 'string' && survey_key !== "") {
            params.survey_key = survey_key;
        }
        return api.get('/feedbacks/stats', params);
    },

    async fetchFeedBacksByType(type: string, startDate?: string, endDate?: string, survey_key?: string) {
        const params: any = { type, startDate, endDate, limit: 1000 };
        if (survey_key && survey_key !== "") params.survey_key = survey_key;
        return api.get(`/feedbacks`, params);
    },
    async fetchCompare(survey_key?: string, type?: string) {
        const params: any = {};
        if (survey_key && survey_key !== "") params.survey_key = survey_key;
        if (type && type !== "") params.type = type;
        return api.get(`/feedbacks/compare`, params);
    },

    async deleteFeedBack(id: string) {
        return api.delete(`/feedbacks/${id}`);
    }
};