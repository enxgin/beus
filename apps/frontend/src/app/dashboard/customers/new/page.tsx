"use client"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { z } from "zod"
import { useForm, type SubmitHandler } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { api } from "@/lib/api"
import { useAuth } from "@/hooks/use-auth"
import { Badge } from "@/components/ui/badge"
import { X, Plus } from "lucide-react"
import { useState } from "react"

// Define the form schema using Zod
const newCustomerSchema = z.object({
  name: z.string().min(2, { message: "İsim en az 2 karakter olmalıdır." }),
  phone: z
    .string()
    .regex(
      /^(\+90|0)\s*[5-9][0-9]{2}\s*[0-9]{3}\s*[0-9]{2}\s*[0-9]{2}$/, 
      { message: "Geçerli bir Türkiye telefon numarası giriniz. Örn: +905551234567 veya 05551234567" }
    ),
  notes: z.string().optional().or(z.literal('')),
  tags: z.array(z.object({
    name: z.string(),
    color: z.string()
  })).optional(),
  discountRate: z.preprocess(
    (val) => (val === "" ? 0 : Number(val)),
    z.number().min(0).max(100)
  ),
})

// Interface tanımı
type NewCustomerFormValues = {
  name: string
  phone: string
  discountRate: number
  notes?: string
  tags?: { name: string; color: string }[]
}

export default function NewCustomerPage() {
  const router = useRouter()
  const [tags, setTags] = useState<{ name: string; color: string }[]>([])
  const [tagInput, setTagInput] = useState('')
  const [tagColor, setTagColor] = useState('#3b82f6')
  
  // Kullanıcı bilgilerini al
  const { user } = useAuth()
  
  // Kullanıcının bağlı olduğu şubeyi kontrol et
  const userBranch = user?.branch
  
  // Artık etiketleri API'den çekmiyoruz, kullanıcı yeni etiket ekleyebilecek
  
  const form = useForm<NewCustomerFormValues>({
    resolver: zodResolver(newCustomerSchema) as any,
    defaultValues: {
      name: "",
      phone: "",
      notes: "",
      discountRate: 0,
      tags: [],
    },
  })

  const onSubmit: SubmitHandler<NewCustomerFormValues> = async (values) => {
    // Kullanıcının şube bilgisini kontrol et
    if (!userBranch?.id) {
      toast.error("Müşteri eklenemedi. Kullanıcının şube bilgisi bulunamadı!")
      return
    }

    // Telefon numarası formatlama ve validasyon
    let phoneNumber = values.phone.replace(/\s+/g, ''); // Önce boşlukları kaldır
    
    // Eğer telefon numarası zaten +90 ile başlamıyorsa ekle
    if (!phoneNumber.startsWith('+90')) {
      // Başında 0 varsa kaldır
      if (phoneNumber.startsWith('0')) {
        phoneNumber = phoneNumber.substring(1);
      }
      phoneNumber = '+90' + phoneNumber;
    }
    
    // Etiketleri doğru formatta hazırla
    const formattedTags = tags.map(tag => ({
      name: tag.name,
      color: tag.color
    }));
    
    // Müşteri verilerini hazırla
    const customerData = {
      name: values.name,
      phone: phoneNumber,
      notes: values.notes || undefined, // Null/empty string yerine undefined gönder
      discountRate: Number(values.discountRate) || 0, // String'i Number'a dönüştür
      tags: formattedTags.length > 0 ? formattedTags : undefined, // Boş dizi yerine undefined gönder
      branchId: userBranch.id
    }
      
    try {
      
      // API isteği
      const response = await api.post('/customers', customerData)
      
      // Success toast
      toast.success("Müşteri başarıyla eklendi")
      
      // Redirect to customer list
      router.push('/dashboard/customers')
      
    } catch (error: any) {
      // Detaylı hata logları
      console.error("Müşteri eklenirken hata oluştu:", error)
      console.log("Gönderilen veriler:", JSON.stringify(customerData, null, 2))
      console.log("Kullanıcı bilgisi:", { 
        id: user?.id,
        role: user?.role,
        branchInfo: userBranch 
      })
      
      if (error.response) {
        // Sunucudan dönen hata yanıtı
        console.log('Hata detayları:', { 
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers
        })
      }
      
      let errorMessage = "Müşteri eklenirken bir hata oluştu."
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message
        if (Array.isArray(errorMessage)) {
          errorMessage = errorMessage.join(' ')
        }
      }
      
      toast.error(errorMessage)
    }
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Yeni Müşteri Ekle</h1>
          <p className="text-muted-foreground">
            Sisteme yeni bir müşteri ekleyin.
          </p>
        </div>
        <Button variant="outline" onClick={() => router.back()}>
          Geri Dön
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Müşteri Bilgileri</CardTitle>
          <CardDescription>
            Lütfen müşteri bilgilerini eksiksiz doldurun.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-6">
              <FormField
                control={form.control as any}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ad Soyad</FormLabel>
                    <FormControl>
                      <Input placeholder="Ad Soyad" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control as any}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefon</FormLabel>
                      <FormControl>
                        <Input placeholder="05XX XXX XX XX" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                

              </div>
              
              <FormField
                control={form.control as any}
                name="tags" 
                render={() => (
                  <FormItem>
                    <FormLabel>Etiketler</FormLabel>
                    <div className="space-y-4">
                      <div className="flex flex-wrap gap-2">
                        {tags.length > 0 ? (
                          tags.map((tag, index) => (
                            <Badge 
                              key={index} 
                              variant="outline" 
                              className="px-2 py-1"
                              style={{ borderColor: tag.color, color: tag.color }}
                            >
                              {tag.name}
                              <button 
                                type="button"
                                className="ml-1 hover:text-destructive"
                                onClick={() => {
                                  setTags(tags.filter((_, i) => i !== index));
                                }}
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))
                        ) : (
                          <div className="text-sm text-muted-foreground">Henüz etiket eklenmedi</div>
                        )}
                      </div>
                      
                      <div className="border rounded-md p-4">
                        <div className="text-sm font-medium mb-2">Yeni Etiket Ekle</div>
                        <div className="flex flex-col space-y-3">
                          <div className="flex items-center space-x-2">
                            <Input
                              placeholder="Etiket adı"
                              value={tagInput}
                              onChange={(e) => setTagInput(e.target.value)}
                              className="flex-1"
                            />
                            <input
                              type="color"
                              value={tagColor}
                              onChange={(e) => setTagColor(e.target.value)}
                              className="w-10 h-10 p-1 border rounded"
                            />
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="w-full"
                            onClick={() => {
                              if (tagInput.trim()) {
                                setTags([...tags, { name: tagInput.trim(), color: tagColor }]);
                                setTagInput('');
                              }
                            }}
                          >
                            <Plus className="mr-2 h-4 w-4" /> Etiket Ekle
                          </Button>
                        </div>
                      </div>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control as any}
                name="discountRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>İndirim Oranı (%)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0" 
                        max="100" 
                        placeholder="0" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control as any}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notlar</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Müşteri hakkında notlar..."
                        className="resize-none"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex justify-end space-x-4">
                <Button variant="outline" type="button" onClick={() => router.back()}>
                  İptal
                </Button>
                <Button type="submit">
                  Müşteri Oluştur
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
