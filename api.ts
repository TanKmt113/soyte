// const BASE_URL = 'https://suckhoethudo.vn:7005/api';
const BASE_URL = 'https://10.10.10.19:7002/api';

export const api = {
  async get(endpoint: string, params?: Record<string, any>) {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
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
        url += (url.includes('?') ? '&' : '?') + queryString;
      }
    }

    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`,
          'Accept': 'application/json',
        },
      });
      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('auth_token');
          window.dispatchEvent(new Event('auth-change'));
        }
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }
      return response.json();
    } catch (error) {
      console.warn(`GET ${cleanEndpoint} failed:`, error);
      throw error;
    }
  },

  async post(endpoint: string, data: any) {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    try {
      const response = await fetch(`${BASE_URL}${cleanEndpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`,
          'Accept': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error(`API Error: ${response.status} ${response.statusText}`);
      return response.json();
    } catch (error) {
      console.warn(`POST ${cleanEndpoint} failed:`, error);
      throw error;
    }
  },

  async put(endpoint: string, data: any) {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    try {
      const response = await fetch(`${BASE_URL}${cleanEndpoint}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`,
          'Accept': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error(`API Error: ${response.status} ${response.statusText}`);
      return response.json();
    } catch (error) {
      console.warn(`PUT ${cleanEndpoint} failed:`, error);
      throw error;
    }
  },

  async delete(endpoint: string) {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    try {
      const response = await fetch(`${BASE_URL}${cleanEndpoint}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`,
          'Accept': 'application/json',
        },
      });
      if (!response.ok) throw new Error(`API Error: ${response.status} ${response.statusText}`);
      return response.json();
    } catch (error) {
      console.warn(`DELETE ${cleanEndpoint} failed:`, error);
      throw error;
    }
  },

  async upload(file: File) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch(`${BASE_URL}/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`,
        },
        body: formData,
      });
      if (!response.ok) throw new Error(`Upload Error: ${response.status} ${response.statusText}`);
      return response.json();
    } catch (error) {
      console.warn(`Upload failed:`, error);
      throw error;
    }
  },

  async getUsers() {
    return this.get('/users');
  }
};
