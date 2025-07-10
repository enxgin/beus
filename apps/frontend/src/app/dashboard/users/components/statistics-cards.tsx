"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCheck, Calendar, DollarSign } from "lucide-react";
import { useUsersStatistics } from "../hooks/use-users";
import { Skeleton } from "@/components/ui/skeleton";

interface StatisticsCardsProps {
  filters?: {
    dateFrom?: string;
    dateTo?: string;
    branchId?: string;
  };
}

export const StatisticsCards = ({ filters }: StatisticsCardsProps) => {
  const { data: statistics, isLoading } = useUsersStatistics(filters);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-1" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const stats = [
    {
      title: "Toplam Personel",
      value: statistics?.totalStaff || 0,
      icon: Users,
      description: "Sistemdeki toplam personel sayısı",
      color: "text-blue-600",
    },
    {
      title: "Aktif Personel",
      value: statistics?.activeStaff || 0,
      icon: UserCheck,
      description: "Seçilen dönemde randevu alan personel",
      color: "text-green-600",
    },
    {
      title: "Toplam Randevu",
      value: statistics?.monthlyAppointments || 0,
      icon: Calendar,
      description: "Seçilen dönemdeki toplam randevu sayısı",
      color: "text-orange-600",
    },
    {
      title: "Toplam Prim",
      value: `₺${(statistics?.totalCommissions || 0).toLocaleString('tr-TR')}`,
      icon: DollarSign,
      description: "Seçilen dönemdeki toplam prim tutarı",
      color: "text-purple-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <Icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};