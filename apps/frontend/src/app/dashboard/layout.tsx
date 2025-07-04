"use client"

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import SideMenu from '@/components/side-menu';
import Header from '@/components/header';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { accessToken, isHydrated } = useAuthStore();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    if (isHydrated && !accessToken) {
      router.push('/');
    }
  }, [isHydrated, accessToken, router]);

  if (!isHydrated) {
    return <div className="flex items-center justify-center h-screen">Yükleniyor...</div>;
  }

  return (
    <div className="flex h-screen bg-secondary/50 text-foreground">
      <SideMenu isOpen={isMenuOpen} setIsOpen={setIsMenuOpen} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header onMenuClick={() => setIsMenuOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
