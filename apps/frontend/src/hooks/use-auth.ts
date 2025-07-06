import { useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import api from '@/lib/api'; // Merkezi API istemcisini kullan

// Global User tipi ile tutarlı olması için buradaki arayüzü @/types/user'dan import etmek daha iyi olacaktır
// User tipini auth.store.ts'den import et
import { User } from '@/types/user';

interface JWTPayload {
  sub: string; // user ID
  email: string;
  name: string;
  role: User['role'];
  branch: User['branch'];
  iat: number;
  exp: number;
}

// Bu geçici bir kimlik doğrulama hook'udur.
// Gerçek uygulamanızda burayı kendi kimlik doğrulama mantığınızla değiştirmelisiniz.
export function useAuth() {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  
  // Zustand store'dan auth bilgilerini al
  const { user, token, login: storeLogin, logout: storeLogout, isHydrated } = useAuthStore();

  // Token yönetimi artık /lib/api.ts içindeki interceptor tarafından
  // her istekte otomatik olarak yapıldığı için bu useEffect'e gerek kalmadı.

  // Sayfa yüklenirken token kontrolü
  useEffect(() => {
    const checkAuth = async () => {
      try {
        setLoading(true);
        
        if (!isHydrated) return; // Store yüklenene kadar bekle
        
        // Token varsa kontrol et
        if (token) {
          try {
            // Token'in geçerliliğini kontrol et (istek atarak)
            // Backend'de /auth/profile endpoint'i kullanılıyor
            await api.get('/auth/profile');
            // Başarılıysa, zaten store'daki user bilgisi güncel
          } catch (e) {
            // API hatası - token geçersiz
            console.error('Token doğrulama hatası:', e);
            storeLogout();
            setError('Oturum süresi dolmuş, lütfen tekrar giriş yapın');
          }
        }
      } catch (error) {
        console.error('Kimlik doğrulama hatası:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [isHydrated, token, storeLogout]);

  // Login fonksiyonu
  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      
      const response = await api.post('/auth/login', { email, password });
      console.log('Login yanıtı alındı:', response.data);
      
      // Token bilgilerini extract et ve token formatını kontrol et
      // Backend'den accessToken adıyla gelse de biz token olarak kullanıyoruz
      const { accessToken: token, user: userData } = response.data;

      if (!token) {
        throw new Error('Token bulunamadı');
      }

      // Token'ı decode et
      const decoded = jwtDecode<JWTPayload>(token);
      console.log('JWT token decode edildi:', decoded);

      // Login işleminin debug bilgisi
      console.log('Login işlemi başarılı, store güncellemeden önce durumu:', {
        storeState: useAuthStore.getState(),
        userData,
        token: token?.substring(0, 10) + '...',
      });

      // Zustand store'a kullanıcı ve token bilgilerini kaydet
      storeLogin(
        userData || {
          id: decoded.sub,
          name: decoded.name,
          email: decoded.email,
          role: decoded.role,
          branch: decoded.branch,
        },
        token
      );
      
      // Login işleminin debug bilgisi - store güncellemeden sonra
      console.log('Login işlemi tamamlandı, güncel store durumu:', {
        storeState: useAuthStore.getState()
      });
      
      return true;
    } catch (error: any) {
      console.error('Giriş hatası:', error);
      
      // Spesifik hata mesajları göster
      if (error.message === 'Network Error') {
        setError(`Sunucu bağlantı hatası: Lütfen internet bağlantınızı kontrol edin veya yöneticinize başvurun.`);
      } else if (error.response?.status === 401) {
        setError('Geçersiz e-posta veya şifre.');
      } else {
        setError(
          error.response?.data?.message || 
          error.message || 
          'Giriş başarısız'
        );
      }
      
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Logout fonksiyonu
  const logout = () => {
    storeLogout();
    router.push('/login');
  };

  return {
    user,
    loading: loading || !isHydrated, // Store henüz yüklenmemişse yükleniyor olarak göster
    error,
    isAuthenticated: !!user && !!token,
    login,
    logout
  };
}
