import { api } from "../api";

export const socialFacilitiesService = {
    getAll: async (page: number = 1, limit: number = 10, type?: string) => {
        const response = await api.get('/social-facilities', { page, limit, ...(type ? { type } : {}) });
        return response.data;
    },
    fetchAll: async () => {
        const response = await api.get('/social-facilities', { page: 1, limit: 1000 });
        return response.data;
    },
    getById: async (id: string) => {
        const response = await api.get(`/social-facilities/${id}`);
        return response.data;
    },
    create: async (data: any) => {
        const response = await api.post(`/social-facilities`, data);
        return response.data;
    },
    update: async (id: string, data: any) => {
        const response = await api.put(`/social-facilities/${id}`, data);
        return response.data;
    },
    delete: async (id: string) => {
        const response = await api.delete(`/social-facilities/${id}`);
        return response.data;
    },
};