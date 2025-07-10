"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUserFinancial } from "../../hooks/use-users";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import { DollarSign, TrendingUp, Receipt, Calendar } from "lucide-react";

interface FinancialOverviewProps {
  userId: string;
  filters?: {
    dateFrom?: string;
    dateTo?: string;
  };
}

export const FinancialOverview = ({ userId, filters }: FinancialOverviewProps) => {
  const { data: financialData, isLoading } = useUserFinancial(userId, filters);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(2)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[...Array(4)].map((_, j) => (
                  <div key={j} className="flex justify-between">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!financialData) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-muted-foreground">
              Mali bilgiler yüklenemedi
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Toplam prim hesapla
  const totalCommissions = financialData.monthlyCommissions?.reduce(
    (sum: number, month: any) => sum + month.amount, 0
  ) || 0;

  return (
    <div className="space-y-6">
      {/* Özet Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Toplam Prim (12 Ay)
            </CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ₺{totalCommissions.toLocaleString('tr-TR')}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Hizmet Çeşidi
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {financialData.serviceEarnings?.length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Prim Ödemeleri
            </CardTitle>
            <Receipt className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {financialData.commissionHistory?.length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Aylık Prim Detayları */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Aylık Prim Detayları
            </CardTitle>
            <p className="text-sm text-muted-foreground">Son 12 aylık prim geçmişi</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {financialData.monthlyCommissions?.slice(-6).reverse().map((month: any) => {
                const monthName = new Date(month.month + '-01').toLocaleDateString('tr-TR', {
                  year: 'numeric',
                  month: 'long'
                });
                
                return (
                  <div key={month.month} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div>
                      <p className="font-medium">{monthName}</p>
                      <p className="text-sm text-muted-foreground">
                        {month.count} prim ödemesi
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">
                        ₺{month.amount.toLocaleString('tr-TR')}
                      </p>
                    </div>
                  </div>
                );
              })}
              
              {(!financialData.monthlyCommissions || financialData.monthlyCommissions.length === 0) && (
                <div className="text-center py-8 text-muted-foreground">
                  <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Henüz prim kaydı bulunmuyor</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Hizmet Bazlı Kazançlar */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Hizmet Bazlı Kazançlar
            </CardTitle>
            <p className="text-sm text-muted-foreground">Seçilen dönemdeki hizmet performansı</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {financialData.serviceEarnings?.map((service: any) => (
                <div key={service.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex-1">
                    <p className="font-medium">{service.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {service.count} işlem
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-blue-600">
                      ₺{service.earnings.toLocaleString('tr-TR')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Ort: ₺{Math.round(service.earnings / service.count).toLocaleString('tr-TR')}
                    </p>
                  </div>
                </div>
              ))}
              
              {(!financialData.serviceEarnings || financialData.serviceEarnings.length === 0) && (
                <div className="text-center py-8 text-muted-foreground">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Seçilen dönemde hizmet kaydı bulunmuyor</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Prim Geçmişi */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Son Prim Ödemeleri
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Seçilen dönemdeki prim ödemeleri ({financialData.commissionHistory?.length || 0} kayıt)
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {financialData.commissionHistory?.slice(0, 10).map((commission: any) => (
              <div key={commission.id} className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{commission.service?.name || 'Bilinmeyen Hizmet'}</p>
                    <Badge 
                      variant={commission.status === 'PAID' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {commission.status === 'PAID' ? 'Ödendi' : 
                       commission.status === 'PENDING' ? 'Bekliyor' : 
                       commission.status === 'APPROVED' ? 'Onaylandı' : commission.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(commission.createdAt), { 
                      addSuffix: true, 
                      locale: tr 
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-600">
                    ₺{commission.amount.toLocaleString('tr-TR')}
                  </p>
                  {commission.invoice?.totalAmount && (
                    <p className="text-xs text-muted-foreground">
                      Fatura: ₺{commission.invoice.totalAmount.toLocaleString('tr-TR')}
                    </p>
                  )}
                </div>
              </div>
            ))}
            
            {(!financialData.commissionHistory || financialData.commissionHistory.length === 0) && (
              <div className="text-center py-8 text-muted-foreground">
                <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Seçilen dönemde prim kaydı bulunmuyor</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};