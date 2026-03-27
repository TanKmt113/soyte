import { api } from "../api";

const getAllCache = new Map<string, Promise<any>>();

export const socialFacilitiesService = {
  getAll: async (page: number = 1, limit: number = 10, type?: string) => {
    const cacheKey = `${page}-${limit}-${type || ""}`;

    if (getAllCache.has(cacheKey)) {
      return getAllCache.get(cacheKey);
    }

    const promise = api
      .get("/social-facilities", { page, limit, ...(type ? { type } : {}) })
      .then((res) => res.data);

    getAllCache.set(cacheKey, promise);

    // Xóa cache sau 2 giây để tránh dữ liệu cũ nhưng vẫn đảm bảo giải quyết gán song song
    setTimeout(() => {
      getAllCache.delete(cacheKey);
    }, 2000);

    return promise;
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