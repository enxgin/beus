"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import {
  ArrowLeft,
  Building,
  Calendar,
  CreditCard,
  Edit,
  Eye,
  HomeIcon,
  Mail,
  MoreHorizontal,
  Package,
  Phone,
  Receipt,
  RefreshCcw,
  Tag,
  User
} from "lucide-react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import api from "@/lib/api"
import { Customer } from "../data/schema"
import { EditCustomerDialog } from "../components/edit-customer-dialog"
import { AnalyticsCards } from "./components/analytics-cards"
import { useCustomerAnalytics } from "./hooks/use-customer-analytics"

export default function CustomerProfilePage() {
  const params = useParams()
  const router = useRouter()
  const customerId = params.id as string
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const queryClient = useQueryClient()

  const { data: customer, isLoading, isError, refetch } = useQuery<Customer>({
    queryKey: ["customer", customerId],
    queryFn: async () => {
      const response = await api.get(`/customers/${customerId}`)
      console.log('Müşteri Profil API yanıtı:', response.data)
      console.log('Müşteri etiketleri:', response.data.tags)
      return response.data
    },
    enabled: !!customerId,
  })

  const { data: analytics, isLoading: isAnalyticsLoading } = useCustomerAnalytics(customerId)

  useEffect(() => {
    if (!isEditDialogOpen) {
      queryClient.invalidateQueries({ queryKey: ["customer", customerId] })
    }
  }, [isEditDialogOpen, queryClient, customerId])

  const totalSpent = useMemo(() => {
    return customer?.payments?.reduce((acc, payment) => acc + payment.amount, 0) ?? 0
  }, [customer?.payments])

  const upcomingAppointment = useMemo(() => {
    if (!customer?.appointments) return null
    const now = new Date()
    return customer.appointments
      .filter(a => new Date(a.startTime) > now)
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())[0]
  }, [customer?.appointments])

  if (isLoading) {
    return (
      <div className="p-4 md:p-8 space-y-4">
        <Skeleton className="h-10 w-1/4" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (isError || !customer) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <p className="text-red-500">Müşteri verileri yüklenemedi.</p>
        <Button onClick={() => refetch()} className="mt-4">Tekrar Dene</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <Breadcrumb>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard">
              <HomeIcon className="h-4 w-4" />
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard/customers">Müşteriler</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem isCurrentPage>
            <BreadcrumbLink>{customer.name}</BreadcrumbLink>
          </BreadcrumbItem>
        </Breadcrumb>
        <div className="flex items-center justify-between mt-2">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Müşteri Profili</h1>
            <p className="text-muted-foreground mt-1">
              {customer.name} müşterisinin detaylı bilgileri ve geçmişi.
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setIsEditDialogOpen(true)}>
                <Edit className="mr-2 h-4 w-4" />
                <span>Müşteriyi Düzenle</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <EditCustomerDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        customer={customer}
      />

      {/* Analytics Kartları */}
      <AnalyticsCards
        analytics={analytics}
        isLoading={isAnalyticsLoading}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" /> Müşteri Bilgileri
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <h1 className="text-2xl font-bold">{customer.name}</h1>
              </div>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  <span>{customer.phone}</span>
                </div>
                {customer.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    <span>{customer.email}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  <span>{customer.branch?.name}</span>
                </div>
              </div>
              {/* Etiket başlığı ve etiketler bölümü */}
              <div className="pt-2">
                <h4 className="font-semibold mb-2 flex items-center gap-2"><Tag className="h-4 w-4"/> Etiketler</h4>
                <div className="flex flex-wrap gap-2 mt-2">

                  {/* API'den gelen etiketleri render etme - çok esnek */}
                  {customer?.tags && Array.isArray(customer.tags) && customer.tags.map((tagItem: any, index: number) => {
                    // API yanıtında gördüğümüz yapıya uygun olarak etiketleri çıkar
                    // Etiket bilgileri tagItem.tag alt nesnesinde geliyor
                    const tagObject = tagItem.tag || tagItem;
                    
                    // Etiket nesnesini kontrol et
                    if (!tagObject) return null;
                    
                    // Etiket verilerini çıkar
                    const name = tagObject.name || '';
                    const color = tagObject.color || '#3b82f6';
                    const id = tagObject.id || tagItem.id || `tag-${index}`;
                    
                    // Adı olan etiketleri render et
                    if (name) {
                      return (
                        <Badge 
                          key={id} 
                          variant="outline" 
                          style={{ 
                            backgroundColor: color, 
                            color: '#fff', 
                            borderColor: color 
                          }}
                        >
                          {name}
                        </Badge>
                      );
                    }
                    return null;
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Finansal Özet</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Toplam Harcama</span>
                <span className="font-bold text-lg">{new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(totalSpent)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">İndirim Oranı</span>
                <Badge variant="secondary">%{customer.discountRate ?? 0}</Badge>
              </div>
            </CardContent>
          </Card>

          {upcomingAppointment && (
             <Card>
              <CardHeader>
                <CardTitle>Yaklaşan Randevu</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-primary/10 rounded-full">
                    <Calendar className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">{upcomingAppointment.service?.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(upcomingAppointment.startTime).toLocaleString('tr-TR', { dateStyle: 'long', timeStyle: 'short' })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="lg:col-span-2">
          <Tabs defaultValue="appointments">
            <TabsList>
              <TabsTrigger value="appointments">Randevular</TabsTrigger>
              <TabsTrigger value="packages">Paketler</TabsTrigger>
              <TabsTrigger value="payments">Ödemeler</TabsTrigger>
            </TabsList>
            
            <TabsContent value="appointments" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Randevu Geçmişi</CardTitle>
                </CardHeader>
                <CardContent>
                  {customer.appointments && customer.appointments.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tarih</TableHead>
                          <TableHead>Saat</TableHead>
                          <TableHead>Hizmet</TableHead>
                          <TableHead>Durum</TableHead>
                          <TableHead className="text-right">İşlemler</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {customer.appointments.map((appointment) => (
                          <TableRow key={appointment.id}>
                            <TableCell>{new Date(appointment.startTime).toLocaleDateString('tr-TR')}</TableCell>
                            <TableCell>{new Date(appointment.startTime).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</TableCell>
                            <TableCell>{appointment.service?.name ?? 'N/A'}</TableCell>
                            <TableCell><Badge variant={appointment.status === 'COMPLETED' ? 'success' : 'default'}>{appointment.status}</Badge></TableCell>
                            <TableCell className="text-right">{/* Actions */}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-10 text-muted-foreground">
                      <p>Henüz randevu bulunmuyor.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="packages" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Satın Alınan Paketler</CardTitle>
                </CardHeader>
                <CardContent>
                  {customer.customerPackages && customer.customerPackages.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-2">
                      {customer.customerPackages.map((cp, index) => (
                        <Card key={cp.id || index}>
                          <CardHeader>
                            <CardTitle>{cp.package.name}</CardTitle>
                            <CardDescription>{new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(cp.package.price)}</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <p>Kalan Seans: <span className="font-bold">
                              {typeof cp.remainingSessions === 'object' ? 
                                JSON.stringify(cp.remainingSessions) : 
                                cp.remainingSessions
                              } / 
                              {typeof cp.package.sessionCount === 'object' ? 
                                JSON.stringify(cp.package.sessionCount) : 
                                cp.package.sessionCount
                              }
                            </span></p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10 text-muted-foreground">
                      <Package className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                      <p>Henüz satın alınmış paket bulunmuyor.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="payments" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Ödeme Geçmişi</CardTitle>
                </CardHeader>
                <CardContent>
                  {customer.payments && customer.payments.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tarih</TableHead>
                          <TableHead>Tutar</TableHead>
                          <TableHead>Yöntem</TableHead>
                          <TableHead>Durum</TableHead>
                          <TableHead>İlişkili</TableHead>
                          <TableHead className="text-right">İşlemler</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {customer.payments.map((payment) => (
                          <TableRow key={payment.id}>
                            <TableCell>{new Date(payment.date).toLocaleDateString('tr-TR')}</TableCell>
                            <TableCell>{new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(payment.amount)}</TableCell>
                            <TableCell>{payment.method}</TableCell>
                            <TableCell>
                              <Badge variant={payment.status === 'PAID' ? 'success' : 'default'}>{payment.status}</Badge>
                            </TableCell>
                            <TableCell>{payment.appointmentId ? 'Randevu' : payment.packageId ? 'Paket' : '-'}</TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem><Eye className="mr-2 h-4 w-4" />Görüntüle</DropdownMenuItem>
                                  <DropdownMenuItem><Receipt className="mr-2 h-4 w-4" />Makbuz</DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem><RefreshCcw className="mr-2 h-4 w-4" />İade Et</DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-10 text-muted-foreground">
                      <Receipt className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                      <p>Henüz ödeme bulunmuyor.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
