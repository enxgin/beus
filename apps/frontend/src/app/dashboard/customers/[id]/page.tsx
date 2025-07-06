"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import axios from "axios"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  ArrowLeft, 
  Building, 
  Calendar, 
  CalendarPlus, 
  CalendarX, 
  CreditCard, 
  Edit, 
  Eye, 
  Mail, 
  MoreHorizontal, 
  Package, 
  Pencil, 
  Phone, 
  Plus, 
  Receipt, 
  RefreshCcw, 
  Tag, 
  Trash, 
  User 
} from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useQuery } from "@tanstack/react-query"
import api from "@/lib/api"
import { useAuthStore } from "@/stores/auth.store"
import { Customer } from "../data/schema"
import { EditCustomerDialog } from "../components/edit-customer-dialog"

export default function CustomerProfilePage() {
  const params = useParams()
  const router = useRouter()
  const customerId = params.id as string
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  // Müşteri verilerini çek
  const { data: customer, isLoading, isError } = useQuery<Customer>({
    queryKey: ["customer", customerId],
    queryFn: async () => {
      try {
        const { token } = useAuthStore.getState();
        const response = await api.get(`/customers/${customerId}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        console.log('API\'den gelen müşteri verisi:', response.data);
        
        // Randevuları kontrol et
        if (response.data.appointments) {
          console.log(`${response.data.appointments.length} randevu bulundu`);
        } else {
          console.log('Randevu verisi bulunamadı');
        }
        
        // Paketleri kontrol et
        if (response.data.customerPackages) {
          console.log(`${response.data.customerPackages.length} paket bulundu`);
        } else {
          console.log('Paket verisi bulunamadı');
        }
        
        return response.data;
      } catch (error) {
        console.error('Müşteri verisi çekilirken hata oluştu:', error);
        throw error;
      }
    },
  })

  // Önceki sayfaya dön
  const handleBack = () => {
    router.back()
  }

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <Button variant="ghost" onClick={handleBack} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Geri Dön
        </Button>
        <div className="space-y-4">
          <Skeleton className="h-12 w-[250px]" />
          <Skeleton className="h-4 w-[350px]" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Skeleton className="h-[180px]" />
            <Skeleton className="h-[180px]" />
            <Skeleton className="h-[180px]" />
          </div>
        </div>
      </div>
    )
  }

  if (isError || !customer) {
    return (
      <div className="p-6">
        <Button variant="ghost" onClick={handleBack} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Geri Dön
        </Button>
        <div className="rounded-md bg-destructive/15 p-4">
          <p className="text-destructive">Müşteri bilgileri yüklenirken bir hata oluştu.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {customer && (
        <EditCustomerDialog
          customer={customer}
          isOpen={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
        />
      )}
      <Button variant="ghost" onClick={handleBack} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Geri Dön
      </Button>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Müşteri Bilgileri */}
        <Card>
          <CardHeader>
            <CardTitle>Müşteri Bilgileri</CardTitle>
            <CardDescription>Müşteri hakkında temel bilgiler</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-4">
              <User className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium leading-none">İsim</p>
                <p className="text-sm text-muted-foreground">{customer.name}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Phone className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium leading-none">Telefon</p>
                <p className="text-sm text-muted-foreground">{customer.phone}</p>
              </div>
            </div>
            {customer.email && (
              <div className="flex items-center space-x-4">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium leading-none">E-posta</p>
                  <p className="text-sm text-muted-foreground">{customer.email}</p>
                </div>
              </div>
            )}
            <div className="flex items-center space-x-4">
              <Building className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium leading-none">Şube</p>
                <p className="text-sm text-muted-foreground">
                  {customer.branch?.name || 'Belirtilmemiş'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Tag className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium leading-none">Etiketler</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {customer.tags && Array.isArray(customer.tags) && customer.tags.length > 0 ? (
                    customer.tags.map((tagItem) => {
                      // API'den gelen veri yapısını kontrol et
                      console.log('Etiket verisi:', tagItem);
                      
                      // Farklı veri yapılarını destekle
                      // TypeScript hatası nedeniyle tip kontrolü yapıyoruz
                      const tag = 'tag' in tagItem ? (tagItem as any).tag : tagItem;
                      const id = tag?.id || tagItem?.id || `tag-${Math.random()}`;
                      const name = tag?.name || tagItem?.name || 'Bilinmeyen';
                      const color = tag?.color || tagItem?.color || '#888888';
                      
                      return (
                        <Badge 
                          key={id} 
                          variant="outline" 
                          className="text-xs" 
                          style={{ borderColor: color, color: color }}
                        >
                          {name}
                        </Badge>
                      );
                    })
                  ) : (
                    <span className="text-xs text-muted-foreground">Etiket yok</span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => setIsEditDialogOpen(true)}
            >
              Müşteri Bilgilerini Düzenle
            </Button>
          </CardFooter>
        </Card>

        {/* Müşteri Notları */}
        <Card>
          <CardHeader>
            <CardTitle>Notlar</CardTitle>
            <CardDescription>Müşteri hakkında özel notlar</CardDescription>
          </CardHeader>
          <CardContent>
            {customer.notes ? (
              <p className="text-sm">{customer.notes}</p>
            ) : (
              <p className="text-sm text-muted-foreground italic">Bu müşteri için not bulunmuyor.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Müşteri İstatistikleri */}
      <div className="bg-card shadow-sm rounded-lg p-6 mt-6 border">
        <h2 className="text-xl font-semibold text-foreground mb-4">Müşteri İstatistikleri</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Randevu İstatistikleri */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/40 dark:to-blue-900/30 p-4 rounded-lg border border-blue-200 dark:border-blue-800 shadow-sm">
            <div className="flex items-center">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-100 dark:bg-blue-800 rounded-lg flex items-center justify-center">
                <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-blue-800 dark:text-blue-300">Toplam Randevu</p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-200">
                  {customer.appointments?.length || 0}
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-400">
                  Tamamlanan: {customer.appointments?.filter(app => app.status === 'COMPLETED').length || 0} | 
                  İptal: {customer.appointments?.filter(app => app.status === 'CANCELLED').length || 0}
                </p>
              </div>
            </div>
          </div>

          {/* Ödeme İstatistikleri */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/40 dark:to-green-900/30 p-4 rounded-lg border border-green-200 dark:border-green-800 shadow-sm">
            <div className="flex items-center">
              <div className="flex-shrink-0 w-10 h-10 bg-green-100 dark:bg-green-800 rounded-lg flex items-center justify-center">
                <CreditCard className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800 dark:text-green-300">Toplam Ödeme</p>
                <p className="text-2xl font-bold text-green-900 dark:text-green-200">₺0</p>
                <p className="text-xs text-green-600 dark:text-green-400">
                  0 işlem
                </p>
              </div>
            </div>
          </div>

          {/* Paket İstatistikleri */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/40 dark:to-purple-900/30 p-4 rounded-lg border border-purple-200 dark:border-purple-800 shadow-sm">
            <div className="flex items-center">
              <div className="flex-shrink-0 w-10 h-10 bg-purple-100 dark:bg-purple-800 rounded-lg flex items-center justify-center">
                <Package className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-purple-800 dark:text-purple-300">Paket Sayısı</p>
                <p className="text-2xl font-bold text-purple-900 dark:text-purple-200">
                  {customer.customerPackages?.length || 0}
                </p>
                <p className="text-xs text-purple-600 dark:text-purple-400">
                  Aktif: {customer.customerPackages?.filter(pkg => new Date(pkg.expiryDate) > new Date()).length || 0} | 
                  Tamamlanan: {customer.customerPackages?.filter(pkg => new Date(pkg.expiryDate) <= new Date()).length || 0}
                </p>
              </div>
            </div>
          </div>

          {/* Mesaj İstatistikleri */}
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/40 dark:to-orange-900/30 p-4 rounded-lg border border-orange-200 dark:border-orange-800 shadow-sm">
            <div className="flex items-center">
              <div className="flex-shrink-0 w-10 h-10 bg-orange-100 dark:bg-orange-800 rounded-lg flex items-center justify-center">
                <svg className="h-5 w-5 text-orange-600 dark:text-orange-400" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-orange-800 dark:text-orange-300">Gönderilen Mesaj</p>
                <p className="text-2xl font-bold text-orange-900 dark:text-orange-200">0</p>
                <p className="text-xs text-orange-600 dark:text-orange-400">
                  SMS: 0 | WhatsApp: 0
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Müşteri Geçmişi Özeti */}
        <div className="mt-4 pt-4 border-t border-border">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
            {customer.appointments && customer.appointments.length > 0 && (
              <>
                <div>
                  <span className="font-medium text-foreground">İlk Randevu:</span> 
                  {new Date(customer.appointments.sort((a, b) => 
                    new Date(a.startTime).getTime() - new Date(b.startTime).getTime())[0]?.startTime).toLocaleDateString('tr-TR')}
                </div>
                <div>
                  <span className="font-medium text-foreground">Son Randevu:</span> 
                  {new Date(customer.appointments.sort((a, b) => 
                    new Date(b.startTime).getTime() - new Date(a.startTime).getTime())[0]?.startTime).toLocaleDateString('tr-TR')}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      
      {/* Müşteri Detay Sekmeleri */}
      <Tabs defaultValue="appointments" className="mt-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="appointments">Randevu Geçmişi</TabsTrigger>
          <TabsTrigger value="packages">Paket Kullanımları</TabsTrigger>
          <TabsTrigger value="payments">Ödeme Geçmişi</TabsTrigger>
        </TabsList>
        
        {/* Randevu Geçmişi Sekmesi */}
        <TabsContent value="appointments" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Randevu Geçmişi</CardTitle>
                <CardDescription>
                  Müşterinin geçmiş ve gelecek randevuları
                </CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <Input 
                  placeholder="Hizmet ara..."
                  className="w-[200px]"
                />
                <Select>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Durum" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tümü</SelectItem>
                    <SelectItem value="PENDING">Bekliyor</SelectItem>
                    <SelectItem value="CONFIRMED">Onaylandı</SelectItem>
                    <SelectItem value="COMPLETED">Tamamlandı</SelectItem>
                    <SelectItem value="CANCELLED">İptal</SelectItem>
                    <SelectItem value="NO_SHOW">Gelmedi</SelectItem>
                  </SelectContent>
                </Select>
                <Select>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Ödeme Durumu" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tümü</SelectItem>
                    <SelectItem value="PENDING">Bekliyor</SelectItem>
                    <SelectItem value="PARTIAL">Kısmi</SelectItem>
                    <SelectItem value="PAID">Ödendi</SelectItem>
                    <SelectItem value="REFUNDED">İade</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {customer.appointments && customer.appointments.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tarih</TableHead>
                      <TableHead>Saat</TableHead>
                      <TableHead>Hizmet</TableHead>
                      <TableHead>Personel</TableHead>
                      <TableHead>Durum</TableHead>
                      <TableHead>Ödeme</TableHead>
                      <TableHead>Fiyat</TableHead>
                      <TableHead className="text-right">İşlemler</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customer.appointments.map((appointment) => {
                      const appointmentDate = new Date(appointment.startTime);
                      const formattedDate = appointmentDate.toLocaleDateString('tr-TR');
                      const formattedTime = appointmentDate.toLocaleTimeString('tr-TR', {
                        hour: '2-digit',
                        minute: '2-digit'
                      });
                      
                      return (
                        <TableRow key={appointment.id}>
                          <TableCell>{formattedDate}</TableCell>
                          <TableCell>{formattedTime}</TableCell>
                          <TableCell>{appointment.service?.name || '-'}</TableCell>
                          <TableCell>{appointment.staff?.name || '-'}</TableCell>
                          <TableCell>
                            <Badge 
                              variant={appointment.status === 'COMPLETED' ? 'default' : 
                                     appointment.status === 'CANCELLED' ? 'destructive' : 
                                     appointment.status === 'CONFIRMED' ? 'outline' : 
                                     appointment.status === 'NO_SHOW' ? 'secondary' : 'default'}
                            >
                              {appointment.status === 'PENDING' ? 'Bekliyor' :
                               appointment.status === 'CONFIRMED' ? 'Onaylandı' :
                               appointment.status === 'COMPLETED' ? 'Tamamlandı' :
                               appointment.status === 'CANCELLED' ? 'İptal' :
                               appointment.status === 'NO_SHOW' ? 'Gelmedi' : appointment.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {appointment.invoice ? (
                              <Badge 
                                variant={appointment.invoice.status === 'PAID' ? 'success' : 
                                       appointment.invoice.status === 'PARTIAL' ? 'default' : 
                                       appointment.invoice.status === 'REFUNDED' ? 'outline' : 'secondary'}
                                className={appointment.invoice.status === 'PAID' ? 'bg-green-500 hover:bg-green-600' : 
                                         appointment.invoice.status === 'PARTIAL' ? 'bg-yellow-500 hover:bg-yellow-600' : ''}
                              >
                                {appointment.invoice.status === 'PENDING' ? 'Bekliyor' :
                                 appointment.invoice.status === 'PARTIAL' ? 'Kısmi' :
                                 appointment.invoice.status === 'PAID' ? 'Ödendi' :
                                 appointment.invoice.status === 'REFUNDED' ? 'İade' : 'Bekliyor'}
                              </Badge>
                            ) : (
                              <Badge variant="secondary">Bekliyor</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {appointment.invoice ? 
                              `₺${appointment.invoice.totalAmount.toLocaleString('tr-TR')}` : 
                              '-'}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  <Eye className="mr-2 h-4 w-4" />
                                  Görüntüle
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Düzenle
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem>
                                  <Trash className="mr-2 h-4 w-4" />
                                  Sil
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-10 text-muted-foreground">
                  <CalendarX className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                  <p>Henüz randevu bulunmuyor.</p>
                  <Button className="mt-4" variant="outline">
                    <CalendarPlus className="mr-2 h-4 w-4" />
                    Randevu Oluştur
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Paket Kullanımları Sekmesi */}
        <TabsContent value="packages" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Paket Kullanımları</CardTitle>
                <CardDescription>
                  Müşterinin satın aldığı paketler ve kullanım durumları
                </CardDescription>
              </div>
              {(!customer.customerPackages || customer.customerPackages.length === 0) && (
                <Button>
                  <Package className="mr-2 h-4 w-4" />
                  Paket Sat
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {customer.customerPackages && customer.customerPackages.length > 0 ? (
                <div className="space-y-6">
                  {customer.customerPackages.map((customerPackage) => {
                    // Backend'den gelen tarihleri düzgün şekilde işle
                    const isExpired = new Date(customerPackage.expiryDate) < new Date();
                    const expiryDate = new Date(customerPackage.expiryDate).toLocaleDateString('tr-TR');
                    const purchaseDate = new Date(customerPackage.purchaseDate).toLocaleDateString('tr-TR');
                    
                    // Kalan seans sayısını hesapla
                    let remainingSessions = 0;
                    if (customerPackage.remainingSessions) {
                      try {
                        // remainingSessions bir JSON nesnesi olabilir
                        const sessionsObj = typeof customerPackage.remainingSessions === 'string' 
                          ? JSON.parse(customerPackage.remainingSessions) 
                          : customerPackage.remainingSessions;
                          
                        if (typeof sessionsObj === 'object' && sessionsObj !== null) {
                          remainingSessions = Object.values(sessionsObj).reduce((sum: number, val) => sum + Number(val), 0);
                        }
                      } catch (e) {
                        console.error('Kalan seans hesaplanırken hata:', e);
                      }
                    }
                    
                    return (
                      <div key={customerPackage.id} className="border rounded-lg p-4 relative">
                        <div className="absolute top-4 right-4">
                          {isExpired ? (
                            <Badge variant="secondary" className="bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                              Süresi Dolmuş
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="border-green-500 text-green-600 dark:border-green-400 dark:text-green-400">
                              Aktif
                            </Badge>
                          )}
                        </div>
                        
                        <h3 className="text-lg font-semibold mb-2">{customerPackage.package?.name || 'İsimsiz Paket'}</h3>
                        
                        <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                          <div>
                            <p className="text-muted-foreground">Satın Alma Tarihi</p>
                            <p>{purchaseDate}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Son Kullanma Tarihi</p>
                            <p>{expiryDate}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Kalan Seans</p>
                            <p className="font-medium">{remainingSessions}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Fiyat</p>
                            <p>{customerPackage.package?.price?.toLocaleString('tr-TR') || '0'} ₺</p>
                          </div>
                        </div>
                        
                        {/* Seans Kullanım Detayları */}
                        {customerPackage.remainingSessions && typeof customerPackage.remainingSessions === 'object' && (
                          <div className="mt-4 border-t pt-4">
                            <h4 className="text-sm font-medium mb-2">Seans Detayları</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {Object.entries(customerPackage.remainingSessions as Record<string, number>).map(([serviceName, count]) => (
                                <div key={serviceName} className="flex items-center justify-between bg-background rounded-md p-2 border">
                                  <span className="text-sm">{serviceName}</span>
                                  <Badge variant="secondary">{String(count)} seans</Badge>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        <div className="flex space-x-2 mt-4">
                          <Button size="sm" variant="outline" className="flex-1">
                            <CalendarPlus className="mr-2 h-4 w-4" />
                            Randevu Oluştur
                          </Button>
                          <Button size="sm" variant="outline" className="flex-1">
                            <Package className="mr-2 h-4 w-4" />
                            Paket Sat
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                  
                  <div className="flex justify-end mt-4">
                    <Button>
                      <Package className="mr-2 h-4 w-4" />
                      Yeni Paket Sat
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-10 text-muted-foreground">
                  <Package className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                  <p>Henüz paket bulunmuyor.</p>
                  <Button className="mt-4">
                    <Package className="mr-2 h-4 w-4" />
                    Paket Sat
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Ödeme Geçmişi Sekmesi */}
        <TabsContent value="payments" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Ödeme Geçmişi</CardTitle>
                <CardDescription>
                  Müşterinin tüm ödemeleri
                </CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <Select>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Ödeme Türü" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tümü</SelectItem>
                    <SelectItem value="cash">Nakit</SelectItem>
                    <SelectItem value="credit_card">Kredi Kartı</SelectItem>
                    <SelectItem value="transfer">Havale/EFT</SelectItem>
                  </SelectContent>
                </Select>
                <Select>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Durum" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tümü</SelectItem>
                    <SelectItem value="PENDING">Bekliyor</SelectItem>
                    <SelectItem value="PAID">Ödendi</SelectItem>
                    <SelectItem value="REFUNDED">İade</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {customer.payments && customer.payments.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tarih</TableHead>
                      <TableHead>Tutar</TableHead>
                      <TableHead>Ödeme Türü</TableHead>
                      <TableHead>Durum</TableHead>
                      <TableHead>İlişkili İşlem</TableHead>
                      <TableHead className="text-right">İşlemler</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customer.payments.map((payment) => {
                      const paymentDate = new Date(payment.date);
                      const formattedDate = paymentDate.toLocaleDateString('tr-TR');
                      
                      return (
                        <TableRow key={payment.id}>
                          <TableCell>{formattedDate}</TableCell>
                          <TableCell>₺{payment.amount}</TableCell>
                          <TableCell>
                            {payment.method === 'cash' ? 'Nakit' :
                             payment.method === 'credit_card' ? 'Kredi Kartı' :
                             payment.method === 'transfer' ? 'Havale/EFT' : payment.method}
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={payment.status === 'PAID' ? 'success' : 
                                     payment.status === 'REFUNDED' ? 'outline' : 'secondary'}
                              className={payment.status === 'PAID' ? 'bg-green-500 hover:bg-green-600' : ''}
                            >
                              {payment.status === 'PENDING' ? 'Bekliyor' :
                               payment.status === 'PAID' ? 'Ödendi' :
                               payment.status === 'REFUNDED' ? 'İade' : payment.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {payment.appointmentId ? 'Randevu' : payment.packageId ? 'Paket' : '-'}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  <Eye className="mr-2 h-4 w-4" />
                                  Görüntüle
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Receipt className="mr-2 h-4 w-4" />
                                  Makbuz
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem>
                                  <RefreshCcw className="mr-2 h-4 w-4" />
                                  İade Et
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
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
  )
}
