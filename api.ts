import { SmtpConfig } from "./types";

const BASE_URL = import.meta.env.VITE_API_URL;

const handleResponse = async (response: Response, method: string) => {
  let data;
  try {
    data = await response.json();
  } catch (e) {
    data = {};
  }

  if (data.message) {
    const isGet = method.toUpperCase() === "GET";
    // Only show success toast for mutations (POST, PUT, DELETE, etc.)
    // Always show error toast regardless of method
    const shouldShowToast = response.ok ? !isGet : true;

    if (shouldShowToast) {
      (window as any).$toast?.current?.show({
        severity: response.ok ? "success" : "error",
        summary: response.ok ? "Thành công" : "Lỗi",
        detail: data.message,
        life: 3000,
      });
    }
  }

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem("auth_token");
      window.dispatchEvent(new Event("auth-change"));
    }
    throw new Error(data.message || `API Error: ${response.status} ${response.statusText}`);
  }

  return data;
};

export const api = {
  async get(endpoint: string, params?: Record<string, any>) {
    const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
    let url = `${BASE_URL}${cleanEndpoint}`;

    if (params) {
      const queryParams = new URLSearchParams();
      for (const key in params) {
        if (params[key] !== undefined && params[key] !== null) {
          queryParams.append(key, params[key].toString());
        }
      }
      const queryString = queryParams.toString();
      if (queryString) {
        url += (url.includes("?") ? "&" : "?") + queryString;
      }
    }

    try {
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("auth_token") || ""}`,
          Accept: "application/json",
        },
      });
      return handleResponse(response, "GET");
    } catch (error) {
      console.warn(`GET ${cleanEndpoint} failed:`, error);
      throw error;
    }
  },

  async post(endpoint: string, data: any) {
    const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
    try {
      const response = await fetch(`${BASE_URL}${cleanEndpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("auth_token") || ""}`,
          Accept: "application/json",
        },
        body: JSON.stringify(data),
      });
      return handleResponse(response, "POST");
    } catch (error) {
      console.warn(`POST ${cleanEndpoint} failed:`, error);
      throw error;
    }
  },

  async put(endpoint: string, data: any) {
    const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
    try {
      const response = await fetch(`${BASE_URL}${cleanEndpoint}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("auth_token") || ""}`,
          Accept: "application/json",
        },
        body: JSON.stringify(data),
      });
      return handleResponse(response, "PUT");
    } catch (error) {
      console.warn(`PUT ${cleanEndpoint} failed:`, error);
      throw error;
    }
  },

  async delete(endpoint: string) {
    const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
    try {
      const response = await fetch(`${BASE_URL}${cleanEndpoint}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("auth_token") || ""}`,
          Accept: "application/json",
        },
      });
      return handleResponse(response, "DELETE");
    } catch (error) {
      console.warn(`DELETE ${cleanEndpoint} failed:`, error);
      throw error;
    }
  },

  async upload(file: File) {
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch(`${BASE_URL}/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("auth_token") || ""}`,
        },
        body: formData,
      });
      return handleResponse(response, "POST");
    } catch (error) {
      console.warn(`Upload failed:`, error);
      throw error;
    }
  },

  async getUsers() {
    return this.get("/users");
  },

  async getUser(id: number | string) {
    return this.get(`/users/${id}`);
  },

  async getPermissions(params?: any) {
    return this.get("/permissions", params);
  },

  async createPermission(data: any) {
    return this.post("/permissions", data);
  },

  async updatePermission(id: number | string, data: any) {
    return this.put(`/permissions/${id}`, data);
  },

  async deletePermission(id: number | string) {
    return this.delete(`/permissions/${id}`);
  },

  async updateUser(id: number | string, data: any) {
    return this.put(`/users/${id}`, data);
  },

  async createUser(data: any) {
    return this.post("/users", data);
  },

  async getEmailAccounts() {
    return this.get("/email-accounts");
  },

  async register(data: any) {
    return this.post("/auth/register", data);
  },
  async getSmtpConfig() {
    return this.get("/email-confirm");
  },

  async updateSmtpConfig(data: SmtpConfig) {
    return this.put("/email-confirm", data);
  },

  async confirmPassword(data: { email: string; password: string; token: string }) {
    return this.post("/auth/confirm-password", data);
  },

  async checkToken(token: string) {
    return this.get(`/auth/check-token/${token}`);
  },

  async forgotPassword(email: string) {
    return this.post("/auth/forgot-password", { email });
  },

  async resendVerification(email: string) {
    return this.post("/auth/resend-confirmation", { email });
  },

  async changePassword(data: any) {
    return this.put("/auth/change-password", data);
  },

  async getMe() {
    return this.get("/auth/me");
  },
};
