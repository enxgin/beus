"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuthStore } from "@/stores/auth.store"
import { Building2, Users, Briefcase, Package } from "lucide-react"

const StatCard = ({ title, value, icon: Icon }: { title: string, value: string, icon: React.ElementType }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
    </CardContent>
  </Card>
)

export default function DashboardPage() {
  const { user } = useAuthStore()

  const renderAdminDashboard = () => (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard title="Toplam Şube" value="12" icon={Building2} />
      <StatCard title="Toplam Kullanıcı" value="78" icon={Users} />
      <StatCard title="Toplam Hizmet" value="45" icon={Briefcase} />
      <StatCard title="Toplam Paket" value="23" icon={Package} />
    </div>
  )

  const renderBranchManagerDashboard = () => (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Şube Personeli" value="8" icon={Users} />
        <StatCard title="Bugünkü Randevu" value="+15" icon={Briefcase} />
        <StatCard title="Bekleyen Müşteri" value="3" icon={Package} />
    </div>
  )

  const renderDefaultDashboard = () => (
     <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Bugünkü Randevularım" value="5" icon={Briefcase} />
        <StatCard title="Tamamlanan Hizmet" value="2" icon={Users} />
    </div>
  )

  const getDashboardByRole = () => {
    switch (user?.role) {
      case 'ADMIN':
      case 'SUPER_BRANCH_MANAGER':
        return renderAdminDashboard();
      case 'BRANCH_MANAGER':
        return renderBranchManagerDashboard();
      default:
        return renderDefaultDashboard();
    }
  }

  return (
    <div className="flex flex-col space-y-4">
        <h1 className="text-3xl font-bold">Hoş Geldin, {user?.name}!</h1>
        <p className="text-muted-foreground">
            Yönetim paneline genel bir bakış.
        </p>
        <div className="pt-4">
            {getDashboardByRole()}
        </div>
    </div>
  )
}
