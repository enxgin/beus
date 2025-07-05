import axios from 'axios';
import { useAuthStore } from '@/stores/auth.store';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1',
});

// Interceptor'ı bir kere ve merkezi olarak ayarla
api.interceptors.request.use(
  (config) => {
    // Her istekte store'dan en güncel token'ı al
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Hook artık sadece önceden yapılandırılmış api örneğini döndürür
export const useApi = () => {
  return api;
};
