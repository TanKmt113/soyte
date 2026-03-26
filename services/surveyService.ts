import { api } from '../api';

export const surveyService = {
    async fetchSurveys(page: number = 1, limit: number = 10, type?: string) {
        return api.get('/surveys', { page, limit, ...(type ? { type } : {}) });
    },

    async fetchSurveyById(id: string) {
        return api.get(`/surveys/${id}`);
    },

    async createSurvey(data: any) {
        return api.post('/surveys', data);
    },

    async updateSurvey(id: string, data: any) {
        return api.put(`/surveys/${id}`, data);
    },

    async deleteSurvey(id: string) {
        return api.delete(`/surveys/${id}`);
    }
};
