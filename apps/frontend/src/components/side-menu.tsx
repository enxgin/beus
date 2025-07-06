"use client"

import { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import classNames from 'classnames';
import { useAuthStore } from '@/stores/auth.store';
import { Button } from './ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Home, Users, Calendar, List, Briefcase, LayoutGrid, Package, PackagePlus, ShoppingCart, Landmark, Wallet, 
  CreditCard, TrendingUp, BadgePercent, Receipt, Users2, Star, Gavel, FileText, Bell, Settings2, History, 
  Webhook, Mails, BarChart, LayoutDashboard, TrendingDown, UserCheck, PieChart, Settings, ChevronDown, X
} from 'lucide-react';

// Menü verisi, rol tabanlı erişim için 'roles' alanı eklendi.
const menuData = [
  { label: 'Müşteriler', href: '/dashboard/customers', icon: Users },
  {
    label: 'Randevular', icon: Calendar, children: [
      { label: 'Takvim', href: '/dashboard/appointments/calendar', icon: Calendar },
      { label: 'Liste', href: '/dashboard/appointments/list', icon: List },
    ]
  },
  {
    label: 'Hizmetler', icon: Briefcase, children: [
      { label: 'Hizmet Listesi', href: '/dashboard/services', icon: List },
      { label: 'Hizmet Kategorileri', href: '/dashboard/service-categories', icon: LayoutGrid },
    ]
  },
  {
    label: 'Paketler', icon: Package, children: [
      { label: 'Paket Listesi', href: '/dashboard/packages', icon: List },
      { label: 'Yeni Paket', href: '/dashboard/packages/new', icon: PackagePlus },
      { label: 'Paket Sat', href: '/dashboard/packages/sell', icon: ShoppingCart },
      { label: 'Satılan Paketler', href: '/dashboard/packages/sold', icon: History },
    ]
  },
  {
    label: 'Finans', icon: Landmark, children: [
      { label: 'Kasa Yönetimi', href: '/dashboard/finance/cash-management', icon: Wallet },
      { label: 'Ödemeler', href: '/dashboard/finance/payments', icon: CreditCard },
      { label: 'Alacaklar', href: '/dashboard/finance/receivables', icon: TrendingUp },
      { label: 'Krediler', href: '/dashboard/finance/credits', icon: BadgePercent },
      { label: 'Faturalar', href: '/dashboard/finance/invoices', icon: Receipt },
    ]
  },
  { label: 'Personeller', href: '/dashboard/users', icon: Users2 },
  {
    label: 'Prim Yönetimi', icon: Star, children: [
      { label: 'Prim Kuralları', href: '/dashboard/commissions/rules', icon: Gavel },
      { label: 'Prim Raporları', href: '/dashboard/commissions/reports', icon: FileText },
    ]
  },
  {
    label: 'Bildirim Yönetimi', icon: Bell, children: [
      { label: 'Bildirim Ayarları', href: '/dashboard/notifications/settings', icon: Settings2 },
      { label: 'Mesaj Şablonları', href: '/dashboard/notifications/templates', icon: FileText },
      { label: 'Mesaj Geçmişi', href: '/dashboard/notifications/history', icon: History },
      { label: 'Tetikleyici Kuralları', href: '/dashboard/notifications/triggers', icon: Webhook },
      { label: 'Bildirim Kuyruğu', href: '/dashboard/notifications/queue', icon: Mails },
    ]
  },
  {
    label: 'Raporlar', icon: BarChart, children: [
      { label: 'Raporlar Ana Sayfa', href: '/dashboard/reports', icon: LayoutDashboard },
      { label: 'Günlük Kasa Raporu', href: '/dashboard/reports/daily-cash', icon: Wallet },
      { label: 'Kasa Geçmişi', href: '/dashboard/reports/cash-history', icon: History },
      { label: 'Alacak/Borç Raporu', href: '/dashboard/reports/receivables-payables', icon: TrendingDown },
      { label: 'Personel Prim Raporu', href: '/dashboard/reports/staff-commission', icon: UserCheck },
      { label: 'Finansal Dashboard', href: '/dashboard/reports/financial-dashboard', icon: PieChart },
    ]
  },
  { label: 'Ayarlar', href: '/dashboard/settings', icon: Settings },
  {
    label: 'Admin', icon: Gavel, roles: ['admin'], children: [
      { label: 'Şubeler', href: '/dashboard/branches', icon: Landmark },
    ]
  },
];

interface SideMenuProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export default function SideMenu({ isOpen, setIsOpen }: SideMenuProps) {
  const { user } = useAuthStore();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const asideClassName = classNames(
    'fixed top-0 left-0 z-20 h-full w-64 bg-card p-4 transition-transform duration-300 ease-in-out md:relative md:translate-x-0',
    { 'translate-x-0': isOpen, '-translate-x-full': !isOpen }
  );

  const filteredMenu = useMemo(() => {
    return menuData.filter(item => {
      if (!item.roles) {
        return true; // Rol koruması yoksa her zaman göster.
      }
      // Rol koruması varsa, kullanıcının rolü eşleşmelidir.
      return user?.role && item.roles.includes(user.role.toLowerCase());
    });
  }, [user]);

  // Hydration hatasını önlemek için, bileşen istemcide mount edilene kadar menüyü render etme.
  if (!isMounted) {
    return (
      <aside className={asideClassName}>
        <div className="flex items-center justify-between mb-8">
          <div className="text-2xl font-bold">SalonFlow</div>
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsOpen(false)}>
            <X className="h-6 w-6" />
          </Button>
        </div>
        {/* Yükleniyor... veya bir iskelet (skeleton) bileşeni gösterilebilir */}
      </aside>
    );
  }

  return (
    <aside className={asideClassName}>
      <div className="flex items-center justify-between mb-8">
        <div className="text-2xl font-bold">SalonFlow</div>
        <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsOpen(false)}>
          <X className="h-6 w-6" />
        </Button>
      </div>

      <nav className="flex flex-col space-y-2">
        <Link href="/dashboard" className="flex items-center space-x-2 p-2 rounded-md hover:bg-muted" onClick={() => setIsOpen(false)}>
          <Home className="h-5 w-5" />
          <span>Anasayfa</span>
        </Link>

        {filteredMenu.map((item, index) =>
          item.children ? (
            <Collapsible key={index}>
              <CollapsibleTrigger className="w-full">
                <div className="flex items-center justify-between p-2 rounded-md hover:bg-muted w-full">
                  <div className="flex items-center space-x-2">
                    <item.icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </div>
                  <ChevronDown className="h-4 w-4 transition-transform duration-200 group-data-[state=open]:-rotate-180" />
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent className="pl-6">
                <div className="flex flex-col space-y-1 mt-1">
                  {item.children.map((child) => (
                    <Link key={child.href} href={child.href} className="flex items-center space-x-2 p-2 rounded-md hover:bg-muted text-sm" onClick={() => setIsOpen(false)}>
                      <child.icon className="h-4 w-4" />
                      <span>{child.label}</span>
                    </Link>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          ) : (
            <Link key={item.href} href={item.href!} className="flex items-center space-x-2 p-2 rounded-md hover:bg-muted" onClick={() => setIsOpen(false)}>
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          )
        )}
      </nav>
    </aside>
  );
}

