"use client";

import { useMemo, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, HomeIcon } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';

import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { extendedColumns, ExtendedUserColumn } from './columns';
import { useUsersWithPerformance } from '../hooks/use-users';
import { StatisticsCards } from './statistics-cards';
import { AdvancedFilters } from './advanced-filters';
import { UserRole } from '@/types/user';

interface FilterState {
  dateFrom: string;
  dateTo: string;
  roles: UserRole[];
  performance: 'high' | 'medium' | 'low' | 'all';
  branchId?: string;
}

export const UsersClient = () => {
  const router = useRouter();
  const { user: currentUser, token, logout } = useAuthStore();

  // Varsayılan filtre durumu
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const [filters, setFilters] = useState<FilterState>({
    dateFrom: startOfMonth.toISOString().split('T')[0],
    dateTo: endOfMonth.toISOString().split('T')[0],
    roles: [],
    performance: 'all',
  });

  const { data: usersResponse, isLoading, isError, error, refetch } = useUsersWithPerformance(filters);

  // Token yoksa ve kullanıcı varsa - tutarsızlık durumunu tespit et ve oturumu sıfırla
  useEffect(() => {
    if (currentUser && !token) {
      console.warn('Oturum tutarsız durumda: Kullanıcı bilgileri var ama token yok. Oturum sıfırlanıyor...');
      logout();
      setTimeout(() => {
        router.push('/login');
      }, 100);
    }
  }, [currentUser, token, logout, router]);

  const formattedUsers: ExtendedUserColumn[] = useMemo(() => {
    if (!usersResponse?.data) {
      return [];
    }

    return usersResponse.data.map((item: any) => ({
      id: item.id,
      name: item.name,
      email: item.email,
      branch: item.branch?.name || 'Atanmamış',
      role: item.role,
      monthlyAppointments: item.monthlyAppointments || 0,
      totalRevenue: item.totalRevenue || 0,
      totalCommissions: item.totalCommissions || 0,
      lastActivity: item.lastActivity,
      performanceScore: item.performanceScore || 0,
      status: item.status || 'inactive',
      isActive: item.isActive ?? true,
    }));
  }, [usersResponse]);

  const handleFiltersChange = (newFilters: FilterState) => {
    setFilters(newFilters);
  };

  if (isError) {
    console.error('USER API HATA DETAYI:', error);
    return (
      <div className="space-y-6">
        <div>
          <Breadcrumb>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard">
                <HomeIcon className="h-4 w-4" />
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem isCurrentPage>
              <BreadcrumbLink>Personeller</BreadcrumbLink>
            </BreadcrumbItem>
          </Breadcrumb>
        </div>
        <div className="text-center py-12">
          <div className="text-lg font-medium mb-2">Personel verileri yüklenirken bir hata oluştu</div>
          <p className="text-muted-foreground mb-4">Lütfen tekrar deneyin veya sistem yöneticisi ile iletişime geçin.</p>
          <Button onClick={() => refetch()}>
            Yeniden Dene
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb ve Header */}
      <div>
        <Breadcrumb>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard">
              <HomeIcon className="h-4 w-4" />
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem isCurrentPage>
            <BreadcrumbLink>Personeller</BreadcrumbLink>
          </BreadcrumbItem>
        </Breadcrumb>
        <div className="flex items-center justify-between mt-2">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Personel Yönetimi</h1>
            <p className="text-muted-foreground mt-1">
              Sistemdeki personelleri görüntüleyin ve yönetin. ({formattedUsers.length} personel)
            </p>
          </div>
          <Button onClick={() => router.push(`/dashboard/users/new`)}>
            <Plus className="mr-2 h-4 w-4" /> Personel Ekle
          </Button>
        </div>
      </div>

      {/* İstatistik Kartları */}
      <StatisticsCards filters={filters} />

      {/* Gelişmiş Filtreler */}
      <AdvancedFilters
        onFiltersChange={handleFiltersChange}
        initialFilters={filters}
      />

      {/* Veri Tablosu */}
      <DataTable
        searchKey="name"
        columns={extendedColumns}
        data={formattedUsers}
        isLoading={isLoading}
      />
    </div>
  );
};
