'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function NotificationsPage() {
  const router = useRouter();

  useEffect(() => {
    // Ana bildirim sayfasına geldiğinde ayarlar sayfasına yönlendir
    router.replace('/dashboard/notifications/settings');
  }, [router]);

  return null;
}