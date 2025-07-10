'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Settings,
  FileText,
  History,
  Zap,
  Clock,
  Bell,
} from 'lucide-react';

const navigationItems = [
  {
    name: 'Ayarlar',
    href: '/dashboard/notifications/settings',
    icon: Settings,
    description: 'SMS, WhatsApp ve E-posta ayarları',
  },
  {
    name: 'Şablonlar',
    href: '/dashboard/notifications/templates',
    icon: FileText,
    description: 'Bildirim şablonlarını yönet',
  },
  {
    name: 'Tetikleyiciler',
    href: '/dashboard/notifications/triggers',
    icon: Zap,
    description: 'Otomatik bildirim kuralları',
  },
  {
    name: 'Kuyruk',
    href: '/dashboard/notifications/queue',
    icon: Clock,
    description: 'Bekleyen bildirimler',
  },
  {
    name: 'Geçmiş',
    href: '/dashboard/notifications/history',
    icon: History,
    description: 'Gönderilen bildirimler',
  },
];

export default function NotificationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Bell className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">
                Bildirim Sistemi
              </h1>
              <p className="text-sm text-gray-500">
                Otomatik bildirim yönetimi
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-start space-x-3 p-3 rounded-lg transition-colors',
                  isActive
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'text-gray-700 hover:bg-gray-50'
                )}
              >
                <Icon className={cn(
                  'h-5 w-5 mt-0.5 flex-shrink-0',
                  isActive ? 'text-blue-600' : 'text-gray-400'
                )} />
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    'text-sm font-medium',
                    isActive ? 'text-blue-700' : 'text-gray-900'
                  )}>
                    {item.name}
                  </p>
                  <p className={cn(
                    'text-xs mt-1',
                    isActive ? 'text-blue-600' : 'text-gray-500'
                  )}>
                    {item.description}
                  </p>
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs font-medium text-gray-900 mb-1">
              Sistem Durumu
            </p>
            <div className="flex items-center space-x-2">
              <div className="h-2 w-2 bg-green-400 rounded-full"></div>
              <span className="text-xs text-gray-600">Aktif</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}