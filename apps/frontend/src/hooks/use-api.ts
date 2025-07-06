import api from '@/lib/api';

// Bu hook, projenin merkezi ve yapılandırılmış API istemcisini döndürür.
// Tüm interceptor mantığı ve baseURL yapılandırması /lib/api.ts dosyasındadır.
export const useApi = () => {
  return api;
};
