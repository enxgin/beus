"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, DollarSign, User, Clock } from "lucide-react";
import { useUserActivities } from "../../hooks/use-users";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";

interface ActivityTimelineProps {
  userId: string;
  limit?: number;
}

const ActivityIcon = ({ type }: { type: string }) => {
  switch (type) {
    case 'appointment':
      return <Calendar className="h-4 w-4 text-blue-600" />;
    case 'commission':
      return <DollarSign className="h-4 w-4 text-green-600" />;
    case 'login':
      return <User className="h-4 w-4 text-purple-600" />;
    default:
      return <Clock className="h-4 w-4 text-gray-600" />;
  }
};

const getActivityBadgeVariant = (type: string, status?: string) => {
  if (type === 'appointment') {
    switch (status) {
      case 'COMPLETED': return 'default';
      case 'CONFIRMED': return 'secondary';
      case 'CANCELLED': return 'destructive';
      default: return 'outline';
    }
  }
  if (type === 'commission') {
    switch (status) {
      case 'PAID': return 'default';
      case 'PENDING': return 'secondary';
      case 'APPROVED': return 'outline';
      default: return 'outline';
    }
  }
  return 'outline';
};

const getStatusDisplayName = (type: string, status?: string) => {
  if (type === 'appointment') {
    const statusNames: Record<string, string> = {
      'COMPLETED': 'Tamamlandı',
      'CONFIRMED': 'Onaylandı',
      'SCHEDULED': 'Planlandı',
      'CANCELLED': 'İptal Edildi',
      'NO_SHOW': 'Gelmedi',
    };
    return statusNames[status || ''] || status;
  }
  if (type === 'commission') {
    const statusNames: Record<string, string> = {
      'PAID': 'Ödendi',
      'PENDING': 'Bekliyor',
      'APPROVED': 'Onaylandı',
      'CANCELED': 'İptal Edildi',
    };
    return statusNames[status || ''] || status;
  }
  return status;
};

export const ActivityTimeline = ({ userId, limit = 20 }: ActivityTimelineProps) => {
  const { data: activities, isLoading } = useUserActivities(userId, limit);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Aktivite Geçmişi</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-start space-x-3">
                <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Aktivite Geçmişi</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Henüz aktivite kaydı bulunmuyor</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Aktivite Geçmişi</CardTitle>
        <p className="text-sm text-muted-foreground">
          Son {activities.length} aktivite
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity: any, index: number) => (
            <div key={activity.id} className="flex items-start space-x-3">
              {/* Aktivite İkonu */}
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                <ActivityIcon type={activity.type} />
              </div>
              
              {/* Aktivite İçeriği */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium leading-5">
                      {activity.description}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(activity.createdAt), { 
                          addSuffix: true, 
                          locale: tr 
                        })}
                      </p>
                      {activity.metadata?.status && (
                        <Badge 
                          variant={getActivityBadgeVariant(activity.type, activity.metadata.status) as any}
                          className="text-xs"
                        >
                          {getStatusDisplayName(activity.type, activity.metadata.status)}
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  {/* Tutar Bilgisi (Prim için) */}
                  {activity.type === 'commission' && activity.metadata?.amount && (
                    <div className="text-right">
                      <p className="text-sm font-medium text-green-600">
                        ₺{activity.metadata.amount.toLocaleString('tr-TR')}
                      </p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Timeline Çizgisi */}
              {index < activities.length - 1 && (
                <div className="absolute left-7 mt-8 w-px h-6 bg-border" 
                     style={{ marginLeft: '1rem' }} />
              )}
            </div>
          ))}
        </div>
        
        {activities.length >= limit && (
          <div className="text-center mt-6 pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              Daha fazla aktivite görmek için detay sayfasını ziyaret edin
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};