"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, UserPlus, Activity, AlertTriangle } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

interface StatsCardsProps {
  stats?: {
    totalCustomers: number
    newCustomersThisMonth: number
    activeCustomers: number
    customersWithDebt: number
  }
  isLoading?: boolean
}

export function StatsCards({ stats, isLoading }: StatsCardsProps) {
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
              <Skeleton className="h-8 w-16 mb-1" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!stats) {
    return null
  }

  const cards = [
    {
      title: "Toplam Müşteri",
      value: stats.totalCustomers,
      description: "Kayıtlı müşteri sayısı",
      icon: Users,
      color: "text-blue-600",
    },
    {
      title: "Bu Ay Yeni",
      value: stats.newCustomersThisMonth,
      description: "Bu ay eklenen müşteriler",
      icon: UserPlus,
      color: "text-green-600",
    },
    {
      title: "Aktif Müşteri",
      value: stats.activeCustomers,
      description: "Son 30 günde randevusu olan",
      icon: Activity,
      color: "text-orange-600",
    },
    {
      title: "Borcu Olan",
      value: stats.customersWithDebt,
      description: "Ödenmemiş borcu olan müşteriler",
      icon: AlertTriangle,
      color: "text-red-600",
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {card.title}
              </CardTitle>
              <Icon className={`h-4 w-4 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value.toLocaleString('tr-TR')}</div>
              <p className="text-xs text-muted-foreground">
                {card.description}
              </p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}