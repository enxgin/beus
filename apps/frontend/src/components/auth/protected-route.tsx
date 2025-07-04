'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/providers/auth-provider';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Eğer sayfa yüklenmiş, kimlik doğrulama tamamlanmış ve kullanıcı giriş yapmamışsa
    if (!loading && !isAuthenticated && pathname !== '/login') {
      router.push('/login');
    }
  }, [isAuthenticated, loading, router, pathname]);

  // Yükleme durumunda yükleniyor göstergesini göster
  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Kimlik doğrulama yapılıyor...</span>
      </div>
    );
  }

  // Kullanıcı kimlik doğrulaması yapılmışsa veya login sayfasındaysa içeriği göster
  return <>{children}</>;
}
