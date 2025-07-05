"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import api from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowLeft, Building, Mail, Phone, Tag, User } from "lucide-react"
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
      const response = await api.get(`/customers/${customerId}`)
      console.log('API\'den gelen müşteri verisi:', response.data)
      return response.data
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

      {/* Randevu Geçmişi - İleride eklenecek */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Randevu Geçmişi</CardTitle>
          <CardDescription>Müşterinin geçmiş randevuları</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground italic">Henüz randevu geçmişi bulunmuyor.</p>
        </CardContent>
      </Card>
    </div>
  )
}
