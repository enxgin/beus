"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, TrendingUp, DollarSign, Target } from "lucide-react";
import { useUserPerformance } from "../../hooks/use-users";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

interface PerformanceDashboardProps {
  userId: string;
  filters?: {
    dateFrom?: string;
    dateTo?: string;
  };
}

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  trend?: number;
  color?: string;
}

const StatsCard = ({ title, value, icon: Icon, trend, color = "text-blue-600" }: StatsCardProps) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className={`h-4 w-4 ${color}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {trend !== undefined && (
          <div className="flex items-center mt-1">
            <Badge 
              variant={trend > 0 ? "default" : trend < 0 ? "destructive" : "secondary"}
              className="text-xs"
            >
              {trend > 0 ? "+" : ""}{trend}%
            </Badge>
            <span className="text-xs text-muted-foreground ml-2">
              önceki döneme göre
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export const PerformanceDashboard = ({ userId, filters }: PerformanceDashboardProps) => {
  const { data: performanceData, isLoading } = useUserPerformance(userId, filters);

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
              <Skeleton className="h-4 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!performanceData) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-muted-foreground">
              Performans verileri yüklenemedi
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Randevu istatistiklerini hesapla
  const totalAppointments = performanceData.appointmentStats?.reduce(
    (sum: number, stat: any) => sum + stat._count, 0
  ) || 0;

  const completedAppointments = performanceData.appointmentStats?.find(
    (stat: any) => stat.status === 'COMPLETED'
  )?._count || 0;

  const stats = [
    {
      title: "Toplam Randevu",
      value: totalAppointments,
      icon: Calendar,
      color: "text-blue-600",
    },
    {
      title: "Toplam Gelir",
      value: `₺${(performanceData.revenueStats?._sum?.totalAmount || 0).toLocaleString('tr-TR')}`,
      icon: TrendingUp,
      color: "text-green-600",
    },
    {
      title: "Prim Kazancı",
      value: `₺${(performanceData.commissionStats?._sum?.amount || 0).toLocaleString('tr-TR')}`,
      icon: DollarSign,
      color: "text-purple-600",
    },
    {
      title: "Performans Skoru",
      value: performanceData.performanceScore || 0,
      icon: Target,
      color: "text-orange-600",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Ana İstatistik Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <StatsCard
            key={index}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            color={stat.color}
          />
        ))}
      </div>

      {/* Detaylı İstatistikler */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Randevu Durumu Dağılımı */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Randevu Durumu</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {performanceData.appointmentStats?.map((stat: any) => {
                const statusNames: Record<string, string> = {
                  'COMPLETED': 'Tamamlanan',
                  'CONFIRMED': 'Onaylanan',
                  'SCHEDULED': 'Planlanan',
                  'CANCELLED': 'İptal Edilen',
                  'NO_SHOW': 'Gelmedi',
                };
                
                const percentage = totalAppointments > 0 
                  ? Math.round((stat._count / totalAppointments) * 100)
                  : 0;

                return (
                  <div key={stat.status} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${
                        stat.status === 'COMPLETED' ? 'bg-green-500' :
                        stat.status === 'CONFIRMED' ? 'bg-blue-500' :
                        stat.status === 'SCHEDULED' ? 'bg-yellow-500' :
                        stat.status === 'CANCELLED' ? 'bg-red-500' :
                        'bg-gray-500'
                      }`} />
                      <span className="text-sm">{statusNames[stat.status] || stat.status}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{stat._count}</span>
                      <Badge variant="secondary" className="text-xs">
                        %{percentage}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Gelir Özeti */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Gelir Özeti</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Toplam Gelir</span>
                <span className="font-medium">
                  ₺{(performanceData.revenueStats?._sum?.totalAmount || 0).toLocaleString('tr-TR')}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Ortalama Gelir</span>
                <span className="font-medium">
                  ₺{(performanceData.revenueStats?._avg?.totalAmount || 0).toLocaleString('tr-TR')}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Ödenen Fatura Sayısı</span>
                <span className="font-medium">
                  {performanceData.revenueStats?._count || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Toplam Prim</span>
                <span className="font-medium text-purple-600">
                  ₺{(performanceData.commissionStats?._sum?.amount || 0).toLocaleString('tr-TR')}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};