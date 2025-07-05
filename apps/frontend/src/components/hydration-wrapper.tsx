"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/stores/auth.store";

interface HydrationWrapperProps {
  children: React.ReactNode;
  loader?: React.ReactNode;
  checkAuth?: boolean; // Token kontrolü yapılsın mı?
}

/**
 * Bu component, Next.js'teki hydration sorunlarını çözmek için kullanılır.
 * Yalnızca component client tarafında mount edildikten sonra children'ı render eder.
 * Bu, localStorage gibi client-side API'larına bağımlı olan state'lerin (örn. Zustand persist)
 * doğru bir şekilde yüklenmesini garanti eder.
 */
const HydrationWrapper: React.FC<HydrationWrapperProps> = ({ 
  children, 
  loader = null,
  checkAuth = true 
}) => {
  const [isHydrated, setIsHydrated] = useState(false);
  const { isHydrated: storeHydrated, token } = useAuthStore();

  // Client tarafına geçişi ve store hydration durumunu kontrol et
  useEffect(() => {
    // Debug bilgisi ekleyelim
    console.log('HydrationWrapper: Client tarafında yükleniyor...', {
      storeState: useAuthStore.getState(),
      isStoreHydrated: storeHydrated,
      hasToken: !!token
    });
    
    setIsHydrated(true);
  }, [storeHydrated, token]);

  if (!isHydrated) {
    // Hydration tamamlanana kadar bir yükleyici veya null göster
    return <>{loader}</>;
  }

  return <>{children}</>;
};

export default HydrationWrapper;
