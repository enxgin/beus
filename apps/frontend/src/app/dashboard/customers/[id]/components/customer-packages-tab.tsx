"use client"

import { useQuery } from "@tanstack/react-query"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Package } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import api from "@/lib/api"

interface CustomerPackagesTabProps {
  customerId: string
}

interface CustomerPackageWithStatus {
  id: string
  purchaseDate: string
  expiryDate: string
  remainingSessions: Record<string, number>
  salesCode: string
  customerId: string
  packageId: string
  createdAt: string
  updatedAt: string
  customer: {
    id: string
    name: string
    phone: string
    email: string
  }
  package: {
    id: string
    name: string
    price: number
    type: string
    totalSessions: number
    totalMinutes: number | null
    validityDays: number
    description: string
    services: Array<{
      packageId: string
      serviceId: string
      quantity: number
      service: {
        id: string
        name: string
        price: number
        duration: number
        description: string | null
      }
    }>
  }
  status: {
    isCompleted: boolean
    totalSessions: number
    usedSessions: number
    remainingSessions: Record<string, number>
    completionPercentage: number
  }
}

export function CustomerPackagesTab({ customerId }: CustomerPackagesTabProps) {
  const { data: packages, isLoading, error } = useQuery<CustomerPackageWithStatus[]>({
    queryKey: ["customer-packages", customerId],
    queryFn: async () => {
      const response = await api.get(`/packages/customer-packages-with-status?customerId=${customerId}`)
      console.log('Müşteri paketleri API yanıtı:', response.data)
      return response.data
    },
    enabled: !!customerId,
  })

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Satın Alınan Paketler</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-10 text-muted-foreground">
            <p>Paket bilgileri yükleniyor...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Satın Alınan Paketler</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-10 text-red-500">
            <p>Paket bilgileri yüklenemedi.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!packages || packages.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Satın Alınan Paketler</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-10 text-muted-foreground">
            <Package className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
            <p>Henüz satın alınmış paket bulunmuyor.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const getStatusBadge = (packageData: CustomerPackageWithStatus) => {
    const isExpired = new Date(packageData.expiryDate) < new Date()
    const isCompleted = packageData.status.isCompleted
    
    if (isExpired) {
      return <Badge variant="destructive">Süresi Doldu</Badge>
    } else if (isCompleted) {
      return <Badge variant="secondary">Tamamlandı</Badge>
    } else {
      return <Badge variant="default">Aktif</Badge>
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Satın Alınan Paketler</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2">
          {packages.map((cp) => (
            <Card key={cp.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{cp.package.name}</CardTitle>
                    <CardDescription>
                      {new Intl.NumberFormat('tr-TR', { 
                        style: 'currency', 
                        currency: 'TRY' 
                      }).format(cp.package.price)}
                    </CardDescription>
                  </div>
                  {getStatusBadge(cp)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Satın Alma:</span>
                    <span>{new Date(cp.purchaseDate).toLocaleDateString('tr-TR')}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Son Kullanma:</span>
                    <span>{new Date(cp.expiryDate).toLocaleDateString('tr-TR')}</span>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Tamamlanma Oranı</span>
                      <span className="text-sm text-muted-foreground">
                        %{Math.round(cp.status.completionPercentage)}
                      </span>
                    </div>
                    <Progress value={cp.status.completionPercentage} className="h-2" />
                  </div>

                  <div className="border-t pt-3">
                    <div className="text-sm font-medium mb-2">Seans Durumu:</div>
                    <div className="space-y-2">
                      {cp.package.services.map((packageService) => {
                        const remaining = cp.remainingSessions[packageService.serviceId] || 0
                        const used = packageService.quantity - remaining
                        
                        return (
                          <div key={packageService.serviceId} className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">{packageService.service.name}:</span>
                            <span className="font-medium">
                              {used}/{packageService.quantity} ({remaining} kaldı)
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}