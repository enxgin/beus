"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  Calendar, 
  Heart, 
  Clock, 
  Package,
  UserPlus,
  TrendingUp,
  Crown,
  Star,
  Activity
} from "lucide-react"
import { CustomerAnalytics } from "../hooks/use-customer-analytics"

interface AnalyticsCardsProps {
  analytics?: CustomerAnalytics
  isLoading?: boolean
}

export function AnalyticsCards({ analytics, isLoading }: AnalyticsCardsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!analytics) {
    return null
  }

  const getStageConfig = (stage: string) => {
    const configs = {
      new: { 
        icon: UserPlus, 
        color: 'text-blue-600', 
        bgColor: 'bg-blue-50',
        badgeVariant: 'default' as const
      },
      developing: { 
        icon: TrendingUp, 
        color: 'text-orange-600', 
        bgColor: 'bg-orange-50',
        badgeVariant: 'secondary' as const
      },
      loyal: { 
        icon: Heart, 
        color: 'text-green-600', 
        bgColor: 'bg-green-50',
        badgeVariant: 'outline' as const
      },
      vip: { 
        icon: Crown, 
        color: 'text-purple-600', 
        bgColor: 'bg-purple-50',
        badgeVariant: 'destructive' as const
      }
    }
    return configs[stage as keyof typeof configs] || configs.new
  }

  const getLoyaltyColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-blue-600'
    if (score >= 40) return 'text-yellow-600'
    if (score >= 20) return 'text-orange-600'
    return 'text-red-600'
  }

  const getLoyaltyVariant = (score: number) => {
    if (score >= 80) return 'default'
    if (score >= 60) return 'secondary'
    if (score >= 40) return 'outline'
    return 'destructive'
  }

  const stageConfig = getStageConfig(analytics.lifecycle.stage)
  const StageIcon = stageConfig.icon

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Müşteri Yaşam Döngüsü */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Yaşam Döngüsü
          </CardTitle>
          <div className={`p-2 rounded-full ${stageConfig.bgColor}`}>
            <StageIcon className={`h-4 w-4 ${stageConfig.color}`} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Badge variant={stageConfig.badgeVariant}>
              {analytics.lifecycle.stageLabel}
            </Badge>
            <p className="text-xs text-muted-foreground">
              {analytics.lifecycle.daysSinceRegistration} gün önce kayıt oldu
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Sadakat Skoru */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Sadakat Skoru
          </CardTitle>
          <Heart className={`h-4 w-4 ${getLoyaltyColor(analytics.loyaltyScore.score)}`} />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className={`text-2xl font-bold ${getLoyaltyColor(analytics.loyaltyScore.score)}`}>
                {analytics.loyaltyScore.score}
              </span>
              <Badge variant={getLoyaltyVariant(analytics.loyaltyScore.score)}>
                {analytics.loyaltyScore.level}
              </Badge>
            </div>
            <Progress 
              value={analytics.loyaltyScore.score} 
              className="h-2"
            />
            <p className="text-xs text-muted-foreground">
              Sıklık: {analytics.loyaltyScore.breakdown.frequency}% • 
              Harcama: {analytics.loyaltyScore.breakdown.spending}%
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Randevu Düzeni */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Randevu Düzeni
          </CardTitle>
          <Clock className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="text-2xl font-bold">
              {analytics.appointmentPattern.averageInterval}
            </div>
            <p className="text-xs text-muted-foreground">
              {analytics.appointmentPattern.intervalUnit} aralıkla
            </p>
            <div className="flex items-center gap-2">
              <Activity className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                Tutarlılık: %{analytics.appointmentPattern.consistency}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Favori Hizmetler */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Favori Hizmetler
          </CardTitle>
          <Star className="h-4 w-4 text-yellow-600" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {analytics.favoriteServices.top3.length > 0 ? (
              <>
                <div className="text-2xl font-bold">
                  {analytics.favoriteServices.top3[0]?.name}
                </div>
                <p className="text-xs text-muted-foreground">
                  %{analytics.favoriteServices.top3[0]?.percentage} oranında tercih
                </p>
                {analytics.favoriteServices.top3.length > 1 && (
                  <div className="space-y-1">
                    {analytics.favoriteServices.top3.slice(1).map((service, index) => (
                      <div key={service.id} className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">{service.name}</span>
                        <span className="text-muted-foreground">%{service.percentage}</span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-4">
                <Package className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">
                  Henüz hizmet geçmişi yok
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}