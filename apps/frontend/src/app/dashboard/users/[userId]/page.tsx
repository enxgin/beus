"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { UserForm } from "./components/user-form";
import { useUser } from "../hooks/use-users";
import { useBranches } from "@/app/dashboard/branches/hooks/use-branches";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { HomeIcon, User, BarChart3, Activity, DollarSign, Calendar } from "lucide-react";
import { PerformanceDashboard } from "./components/performance-dashboard";
import { ActivityTimeline } from "./components/activity-timeline";
import { FinancialOverview } from "./components/financial-overview";

// Statik rol tanımlamaları - Türkçe rol isimleri kullanıldı ve UserRole enum'dan referans alındı
const roles = [
  { id: 'ADMIN', name: 'Admin' },
  { id: 'SUPER_BRANCH_MANAGER', name: 'Üst Şube Yöneticisi' },
  { id: 'BRANCH_MANAGER', name: 'Şube Yöneticisi' },
  { id: 'RECEPTION', name: 'Resepsiyon' },
  { id: 'STAFF', name: 'Personel' },
];

export default function UserPage() {
  const params = useParams();
  const userId = params.userId as string;

  // Tarih filtreleri için state
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const [dateFilters, setDateFilters] = useState({
    dateFrom: startOfMonth.toISOString().split('T')[0],
    dateTo: endOfMonth.toISOString().split('T')[0],
  });

  // Güvenli hook'lar ile veri çekme
  const { data: user, isLoading: isUserLoading } = useUser(userId);
  const { data: branchesData, isLoading: areBranchesLoading } = useBranches();

  const isLoading = isUserLoading || areBranchesLoading;

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-10 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  // Şubeleri `useBranches`'dan gelen formata göre ayarla
  const branches = branchesData || [];

  const handleDateFilterChange = (field: string, value: string) => {
    setDateFilters(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6 p-6">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbItem>
          <BreadcrumbLink href="/dashboard">
            <HomeIcon className="h-4 w-4" />
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink href="/dashboard/users">Personeller</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem isCurrentPage>
          <BreadcrumbLink>{user?.name || 'Personel Detayı'}</BreadcrumbLink>
        </BreadcrumbItem>
      </Breadcrumb>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {user?.name || 'Personel Detayı'}
          </h1>
          <p className="text-muted-foreground">
            {user?.email} • {user?.branch?.name || 'Şube atanmamış'}
          </p>
        </div>
      </div>

      {/* Tarih Filtreleri */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Tarih Aralığı
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dateFrom">Başlangıç Tarihi</Label>
              <Input
                id="dateFrom"
                type="date"
                value={dateFilters.dateFrom}
                onChange={(e) => handleDateFilterChange('dateFrom', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateTo">Bitiş Tarihi</Label>
              <Input
                id="dateTo"
                type="date"
                value={dateFilters.dateTo}
                onChange={(e) => handleDateFilterChange('dateTo', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ana İçerik - Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Genel Bakış
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Aktiviteler
          </TabsTrigger>
          <TabsTrigger value="financial" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Mali Bilgiler
          </TabsTrigger>
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Profil
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <PerformanceDashboard userId={userId} filters={dateFilters} />
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <ActivityTimeline userId={userId} limit={50} />
        </TabsContent>

        <TabsContent value="financial" className="space-y-6">
          <FinancialOverview userId={userId} filters={dateFilters} />
        </TabsContent>

        <TabsContent value="profile" className="space-y-6">
          <UserForm
            initialData={user || null}
            roles={roles}
            branches={branches}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
