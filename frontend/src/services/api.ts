import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL;

export const api = axios.create({
  baseURL,
  timeout: 15000,
  headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('suki_admin_token');
  if (token && config.url?.startsWith('/admin')) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const url: string = error?.config?.url ?? '';
    if (status === 401 && url.startsWith('/admin') && !url.includes('/admin/auth/login')) {
      sessionStorage.removeItem('suki_admin_token');
      if (window.location.pathname !== '/admin/login') {
        window.location.assign('/admin/login');
      }
    }
    return Promise.reject(error);
  },
);
