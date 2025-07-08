"use client"

import { useState, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { format, startOfDay, endOfDay, subDays } from "date-fns"
import { tr } from "date-fns/locale"
import { useAuthStore } from "@/stores/auth.store"
import api from "@/lib/api"
import { formatCurrency } from "@/lib/utils"

// UI Components
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Progress } from "@/components/ui/progress"

// Icons
import { 
  Calendar, 
  Users, 
  CreditCard, 
  AlertCircle, 
  Clock, 
  TrendingUp, 
  ArrowRight,
  CheckCircle2,
  XCircle,
  User
} from "lucide-react"

// Types
interface AppointmentData {
  id: string
  startTime: string
  endTime: string
  status: string
  customer: {
    id: string
    name: string
  }
  service: {
    id: string
    name: string
  }
  staff: {
    id: string
    name: string
  }
}

interface DashboardStats {
  todayAppointmentsCount: number
  totalCustomersCount: number
  dailyRevenue: number
  pendingPaymentsAmount: number
}

interface WeeklyPerformance {
  totalRevenue: number
  totalAppointments: number
  dailyData: {
    date: string
    revenue: number
    appointments: number
  }[]
}

// Dashboard Components
const StatCard = ({ 
  title, 
  value, 
  description, 
  icon: Icon, 
  loading = false 
}: { 
  title: string
  value: string | number
  description?: string
  icon: React.ElementType
  loading?: boolean 
}) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <div className="rounded-full bg-muted p-2">
        <Icon className="h-4 w-4" />
      </div>
    </CardHeader>
    <CardContent>
      {loading ? (
        <Skeleton className="h-8 w-28" />
      ) : (
        <div className="text-2xl font-bold">{value}</div>
      )}
      {description && (
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      )}
    </CardContent>
  </Card>
)

export default function DashboardPage() {
  const { user, token } = useAuthStore()
  const [weekRange, setWeekRange] = useState<{ start: Date; end: Date }>({
    start: subDays(new Date(), 6),
    end: new Date()
  })

  // Fetch dashboard stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["dashboardStats", user?.branchId],
    queryFn: async () => {
      try {
        const response = await api.get("/dashboard/stats", {
          params: {
            branchId: user?.branchId
          }
        })
        
        return response.data || {
          todayAppointmentsCount: 0,
          totalCustomersCount: 0,
          dailyRevenue: 0,
          pendingPaymentsAmount: 0
        }
      } catch (error) {
        console.error("Error fetching dashboard stats:", error)
        return {
          todayAppointmentsCount: 0,
          totalCustomersCount: 0,
          dailyRevenue: 0,
          pendingPaymentsAmount: 0
        }
      }
    },
    enabled: !!user?.branchId && !!token,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  // Fetch recent appointments
  const { data: recentAppointments, isLoading: appointmentsLoading } = useQuery({
    queryKey: ["recentAppointments", user?.branchId],
    queryFn: async () => {
      try {
        const response = await api.get("/dashboard/recent-appointments", {
          params: {
            branchId: user?.branchId,
            limit: 5
          }
        })
        
        return Array.isArray(response.data) ? response.data : []
      } catch (error) {
        console.error("Error fetching recent appointments:", error)
        return []
      }
    },
    enabled: !!user?.branchId && !!token,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  // Fetch weekly performance data
  const { data: weeklyPerformance, isLoading: weeklyLoading } = useQuery({
    queryKey: ["weeklyPerformance", user?.branchId, weekRange.start, weekRange.end],
    queryFn: async () => {
      try {
        const response = await api.get("/dashboard/weekly-performance", {
          params: {
            branchId: user?.branchId,
            startDate: weekRange.start.toISOString(),
            endDate: weekRange.end.toISOString()
          }
        })
        
        const data = response.data || {
          totalRevenue: 0,
          totalAppointments: 0,
          dailyData: []
        }
        
        // Format the dates for display
        if (data.dailyData && Array.isArray(data.dailyData)) {
          data.dailyData = data.dailyData.map((day: { date: string; revenue: number; appointments: number }) => ({
            ...day,
            date: format(new Date(day.date), "d MMM", { locale: tr })
          }))
        }
        
        return data
      } catch (error) {
        console.error("Error fetching weekly performance:", error)
        return {
          totalRevenue: 0,
          totalAppointments: 0,
          dailyData: []
        }
      }
    },
    enabled: !!user?.branchId && !!token,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  // Only show this dashboard for STAFF, BRANCH_MANAGER, and RECEPTION roles
  const allowedRoles = ['STAFF', 'BRANCH_MANAGER', 'RECEPTION']
  
  if (!user || !allowedRoles.includes(user.role)) {
    return (
      <div className="flex flex-col space-y-4">
        <h1 className="text-3xl font-bold">Hoş Geldin, {user?.name}!</h1>
        <p className="text-muted-foreground">
          Yönetim paneline genel bir bakış.
        </p>
        <Card className="mt-4">
          <CardContent className="pt-6">
            <p>Bu sayfayı görüntüleme yetkiniz bulunmamaktadır.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Get appointment status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Tamamlandı</Badge>
      case 'CONFIRMED':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Onaylandı</Badge>
      case 'CANCELLED':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">İptal Edildi</Badge>
      case 'SCHEDULED':
        return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">Planlandı</Badge>
      case 'ARRIVED':
        return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">Geldi</Badge>
      case 'NO_SHOW':
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Gelmedi</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="container mx-auto py-4 px-4 sm:px-0 space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Hoş Geldin, {user?.name}!</h1>
        <p className="text-muted-foreground mt-1">
          {user?.branchId ? "Şubenizin güncel verilerine genel bakış." : "Yönetim paneline genel bir bakış."}
        </p>
      </div>
      
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Bugünkü Randevular" 
          value={statsLoading ? "..." : stats?.todayAppointmentsCount} 
          icon={Calendar} 
          loading={statsLoading}
          description="Bugün için planlanan randevular"
        />
        <StatCard 
          title="Toplam Müşteri" 
          value={statsLoading ? "..." : stats?.totalCustomersCount} 
          icon={Users} 
          loading={statsLoading}
          description="Şubenize kayıtlı müşteriler"
        />
        <StatCard 
          title="Günlük Ciro" 
          value={statsLoading ? "..." : formatCurrency(stats?.dailyRevenue || 0)} 
          icon={CreditCard} 
          loading={statsLoading}
          description="Bugünkü toplam gelir"
        />
        <StatCard 
          title="Bekleyen Ödemeler" 
          value={statsLoading ? "..." : formatCurrency(stats?.pendingPaymentsAmount || 0)} 
          icon={AlertCircle} 
          loading={statsLoading}
          description="Ödenmemiş veya kısmi ödemeli faturalar"
        />
      </div>
      
      {/* Two Column Layout */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Appointments */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Son Randevular</CardTitle>
            <CardDescription>En son eklenen randevular</CardDescription>
          </CardHeader>
          <CardContent>
            {appointmentsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-[250px]" />
                      <Skeleton className="h-4 w-[200px]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : recentAppointments?.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-muted-foreground">Henüz randevu bulunmuyor.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentAppointments?.map((appointment: AppointmentData) => (
                  <div key={appointment.id} className="flex items-start justify-between border-b pb-3 last:border-0">
                    <div className="flex items-start space-x-3">
                      <div className="rounded-full bg-muted p-2">
                        <User className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-medium">{appointment.customer.name}</p>
                        <p className="text-sm text-muted-foreground">{appointment.service.name}</p>
                        <div className="flex items-center mt-1 space-x-2">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(appointment.startTime), "d MMM, HH:mm", { locale: tr })}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div>
                      {getStatusBadge(appointment.status)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button variant="outline" size="sm" className="w-full" asChild>
              <a href="/dashboard/appointments/calendar">
                Tüm Randevular
                <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </CardFooter>
        </Card>
        
        {/* Weekly Performance */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Haftalık Performans</CardTitle>
            <CardDescription>Son 7 gün</CardDescription>
          </CardHeader>
          <CardContent>
            {weeklyLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-[120px] w-full" />
              </div>
            ) : (
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium">Haftalık Ciro</div>
                    <div className="text-xl font-bold">{formatCurrency(weeklyPerformance?.totalRevenue || 0)}</div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium">Toplam Randevu</div>
                    <div className="text-xl font-bold">{weeklyPerformance?.totalAppointments || 0}</div>
                  </div>
                </div>
                
                {/* Simple Chart */}
                <div className="space-y-4">
                  <div className="text-sm font-medium">Günlük Ciro Dağılımı</div>
                  <div className="space-y-2">
                    {weeklyPerformance?.dailyData.map((day: { date: string; revenue: number; appointments: number }, index: number) => {
                      const maxRevenue = Math.max(...weeklyPerformance.dailyData.map((d: { revenue: number }) => d.revenue))
                      const percentage = maxRevenue > 0 ? (day.revenue / maxRevenue) * 100 : 0
                      
                      return (
                        <div key={index} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span>{day.date}</span>
                            <span>{formatCurrency(day.revenue)}</span>
                          </div>
                          <Progress value={percentage} className="h-2" />
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button variant="outline" size="sm" className="w-full" asChild>
              <a href="/dashboard/finance">
                Finans Detayları
                <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
