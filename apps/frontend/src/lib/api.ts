import axios from 'axios';
import { useAuthStore } from '@/stores/auth.store';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.rezervgo.com';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
});

// İstek (request) interceptor'ı - Token ekleme
api.interceptors.request.use(
  (config) => {
    let token = useAuthStore.getState().token;
    
    // Zustand'dan token alamadıysak, manuel yedeği kontrol et
    if (!token && typeof window !== 'undefined') {
      try {
        const manualBackup = localStorage.getItem('auth-manual-backup');
        if (manualBackup) {
          const parsedBackup = JSON.parse(manualBackup);
          if (parsedBackup.token) {
            console.log('Manuel yedekten token alınıyor...');
            token = parsedBackup.token;
            
            // Zustand store'u güncelle
            if (!useAuthStore.getState().token) {
              console.log('Zustand store\'a token geri yükleniyor...');
              useAuthStore.getState().login(parsedBackup.user, parsedBackup.token);
            }
          }
        }
      } catch (e) {
        console.error('Manuel token yedeği okunurken hata:', e);
      }
    }
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('API isteği için token ekleniyor:', token.substring(0, 10) + '...');
    } else {
      // Token yoksa konsola uyarı yazalım
      console.warn('API isteği için token bulunamadı (manuel yedek de yok)');
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Yanıt (response) interceptor'ı - 401 hata yönetimi
api.interceptors.response.use(
  (response) => {
    // Başarılı yanıtlar için konsol bilgisi (development için faydalı)
    if (process.env.NODE_ENV === 'development') {
      console.log(`API Başarılı [${response.config.method?.toUpperCase()}] ${response.config.url}`);
    }
    return response;
  },
  (error) => {
    // Sadece gerçek hatalar için log'lama yap
    if (error.response?.status >= 400 || error.code || error.message) {
      console.error('API Hatası:', {
        status: error.response?.status,
        url: error.config?.url,
        method: error.config?.method,
        data: error.response?.data,
        message: error.message,
        code: error.code,
        name: error.name,
        headers: error.config?.headers ? {
          ...error.config.headers,
          // Token bilgisini gizleme (güvenlik için)
          Authorization: error.config.headers.Authorization ? 'Bearer [FILTERED]' : undefined
        } : undefined
      });
    }
    
    // Eğer error objesi tamamen boşsa, raw error'u da log'la
    if (!error.response && !error.message && !error.code && !error.name) {
      console.warn('Boş error objesi yakalandı:', error);
    }
    
    // 401 Unauthorized hatası aldığımızda
    if (error.response && error.response.status === 401) {
      console.error('401 Unauthorized hatası - Oturum sonlandırılıyor');
      
      // Auth state'i temizle
      const { logout } = useAuthStore.getState();
      logout();
      
      // Manuel yedekleri de temizle
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth-manual-backup');
      }
      
      // Eğer tarayıcı ortamındaysak, login sayfasına yönlendir
      if (typeof window !== 'undefined') {
        // Anlık yönlendirme yerine bir süre sonra yönlendirme yapıyoruz
        // Bu sayede diğer cleanup işlemleri tamamlanabilir
        setTimeout(() => {
          window.location.href = '/login?reason=session_expired';
        }, 100);
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
