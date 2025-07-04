import axios from 'axios';
import { useAuthStore } from '@/stores/auth.store';

export const api = axios.create({
  // .env.local dosyasından NEXT_PUBLIC_API_URL değişkenini okur.
  // Eğer tanımlı değilse, varsayılan olarak http://localhost:8000/api kullanır.
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1',
});

// Her API isteğinden önce çalışacak bir 'request interceptor' (istek yakalayıcı) ekliyoruz.
// Bu, her isteğin başlığına (header) otomatik olarak kimlik doğrulama token'ını ekler.
api.interceptors.request.use(
  (config) => {
    // Zustand store'dan mevcut state'i alıyoruz.
    const { accessToken } = useAuthStore.getState();
    if (accessToken) {
      config.headers['Authorization'] = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    // İstek hatası olursa, hatayı reddederek devam etmesini sağlıyoruz.
    return Promise.reject(error);
  }
);

// Yanıtları ele almak için bir 'response interceptor' (yanıt yakalayıcı) ekliyoruz.
// Örneğin, 401 (Unauthorized) hatası alındığında kullanıcıyı otomatik olarak logout yapabilir.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token geçersiz veya süresi dolmuş. Kullanıcıyı sistemden çıkar.
      useAuthStore.getState().logout();
      // Kullanıcıyı login sayfasına yönlendir.
      if (typeof window !== 'undefined') {
         window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);

/**
 * Backend'den tüm müşterilerin listesini çeker.
 * @returns {Promise<any>} Müşteri verilerini içeren bir promise döndürür.
 */
export const getCustomers = async () => {
  try {
    const response = await api.get('/customers');
    return response.data;
  } catch (error) {
    console.error('Müşterileri çekerken hata oluştu:', error);
    // Hatanın daha üst katmanlarda da yakalanabilmesi için tekrar fırlatıyoruz.
    throw error;
  }
};

export default api;

