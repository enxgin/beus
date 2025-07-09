"use client"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
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
import api from "@/lib/api"
import { useAuth } from "@/hooks/use-auth"
import { Badge } from "@/components/ui/badge"
import { X, Plus } from "lucide-react"
import { useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"

// Final, stable schema definition
const newCustomerSchema = z.object({
  name: z.string().min(2, { message: "İsim en az 2 karakter olmalıdır." }),
  email: z.string().email({ message: "Geçerli bir e-posta adresi giriniz." }).optional().or(z.literal('')), 
  phone: z
    .string()
    .regex(
      /^(\+90|0)\s*[5-9][0-9]{2}\s*[0-9]{3}\s*[0-9]{2}\s*[0-9]{2}$/, 
      { message: "Geçerli bir Türkiye telefon numarası giriniz. Örn: +905551234567 veya 05551234567" }
    ),
  notes: z.string().optional().or(z.literal('')), 
  discountRate: z.coerce.number().min(0, "İndirim oranı 0'dan küçük olamaz.").max(100, "İndirim oranı 100'den büyük olamaz.").optional(),
})

// Infer the type from the schema
type NewCustomerFormValues = z.infer<typeof newCustomerSchema>

// Type for tags used in the frontend state
interface Tag {
  id: string; 
  name: string;
  color: string;
}

export default function NewCustomerPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [tagColor, setTagColor] = useState('#3b82f6')
  
  const { user } = useAuth()
  const userBranch = user?.branch
  
  // Tüm etiketleri API'den çek
  const { data: allTags = [] } = useQuery<Tag[]>({
    queryKey: ['tags'],
    queryFn: async () => {
      const response = await api.get('/tags')
      return response.data
    },
    staleTime: 5 * 60 * 1000, // 5 dakika önbelleğe al
  })
  
  const form = useForm<NewCustomerFormValues>({
    resolver: zodResolver(newCustomerSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      notes: "",
      discountRate: 0,
    },
  })

  // Yeni etiket ekleme fonksiyonu
  const handleAddTag = async () => {
    if (tagInput.trim() !== "") {
      try {
        // Yeni etiketi API'ye gönder
        const response = await api.post('/tags', {
          name: tagInput.trim(),
          color: tagColor
        })
        
        // Başarılı yanıt alındıysa
        if (response.data && response.data.id) {
          // Yeni etiketi seçili etiketlere ekle
          setSelectedTagIds([...selectedTagIds, response.data.id])
          // Etiketleri yeniden çek
          queryClient.invalidateQueries({ queryKey: ['tags'] })
          setTagInput('')
          toast.success("Yeni etiket eklendi")
        }
      } catch (error) {
        console.error("Etiket eklenirken hata oluştu:", error)
        toast.error("Etiket eklenirken bir hata oluştu")
      }
    }
  }

  // Etiket kaldırma fonksiyonu
  const handleRemoveTag = (tagId: string) => {
    setSelectedTagIds(selectedTagIds.filter(id => id !== tagId))
  }

  const onSubmit: SubmitHandler<NewCustomerFormValues> = async (data) => {
    if (!userBranch) {
      toast.error("Kullanıcı şube bilgisi olmadan müşteri oluşturulamaz.")
      return
    }

    // Seçili etiket ID'lerini gönderilecek veriye ekle
    const dataToSend = { 
      ...data, 
      branchId: userBranch.id,
      phone: data.phone.replace(/\s/g, ""), // Clean phone number
      email: data.email === '' ? undefined : data.email,
      notes: data.notes === '' ? undefined : data.notes,
      tagIds: selectedTagIds, // Seçili etiket ID'lerini gönder
    }

    console.log("Gönderilecek veri:", dataToSend)
    console.log("Seçili etiket ID'leri:", selectedTagIds)

    try {
      const response = await api.post("/customers", dataToSend)
      
      if (response.status === 201) {
        toast.success("Müşteri başarıyla oluşturuldu.")
        queryClient.invalidateQueries({ queryKey: ["customers"] })
        router.push("/dashboard/customers")
      } else {
        toast.error("Müşteri oluşturulurken bir hata oluştu.")
      }
    } catch (error: any) {
      console.error("Müşteri oluşturma hatası:", error)
      console.log("Gönderilen veri:", dataToSend)
      const errorMessage = error.response?.data?.message || "Bir hata oluştu."
      toast.error(errorMessage)
    }
  }

  return (
    <div className="p-4 md:p-8">
      <Card>
        <CardHeader>
          <CardTitle>Yeni Müşteri Oluştur</CardTitle>
          <CardDescription>
            Yeni bir müşteri kaydı oluşturmak için aşağıdaki formu doldurun.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>İsim Soyisim</FormLabel>
                    <FormControl>
                      <Input placeholder="Örn: Ahmet Yılmaz" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefon Numarası</FormLabel>
                    <FormControl>
                      <Input placeholder="Örn: 555 123 45 67" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-posta Adresi (İsteğe Bağlı)</FormLabel>
                    <FormControl>
                      <Input placeholder="ornek@eposta.com" {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormItem>
                <FormLabel>Etiketler</FormLabel>
                <div className="flex flex-col gap-2">
                  {/* Seçili Etiketler */}
                  <div className="flex flex-wrap gap-2 mb-2 min-h-[36px] p-2 border rounded-md">
                    {allTags.filter(tag => selectedTagIds.includes(tag.id)).map((tag) => (
                      <Badge 
                        key={tag.id} 
                        variant="outline" 
                        style={{ 
                          backgroundColor: tag.color || '#3b82f6', 
                          color: '#fff', 
                          borderColor: tag.color || '#3b82f6'
                        }}
                      >
                        {tag.name}
                        <button
                          type="button"
                          className="ml-2 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                          onClick={() => handleRemoveTag(tag.id)}
                        >
                          <X className="h-3 w-3 text-white hover:text-gray-200" />
                        </button>
                      </Badge>
                    ))}
                    {selectedTagIds.length === 0 && (
                      <div className="text-sm text-muted-foreground">Etiket yok</div>
                    )}
                  </div>
                  
                  {/* Etiket Seçici */}
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Mevcut Etiketler</div>
                    <div className="flex flex-wrap gap-2">
                      {allTags
                        .filter(tag => !selectedTagIds.includes(tag.id))
                        .map((tag) => (
                          <Badge 
                            key={tag.id} 
                            variant="outline" 
                            className="cursor-pointer"
                            style={{ 
                              backgroundColor: tag.color || '#3b82f6', 
                              color: '#fff', 
                              borderColor: tag.color || '#3b82f6'
                            }}
                            onClick={() => setSelectedTagIds([...selectedTagIds, tag.id])}
                          >
                            {tag.name}
                            <Plus className="ml-1 h-3 w-3 text-white hover:text-gray-200" />
                          </Badge>
                        ))}
                    </div>
                    
                    {/* Yeni Etiket Ekleme */}
                    <div className="text-sm font-medium mt-4">Yeni Etiket Ekle</div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="text"
                        placeholder="Yeni etiket adı..."
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        className="flex-grow"
                      />
                      <Input
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
                      onClick={handleAddTag}
                    >
                      <Plus className="mr-2 h-4 w-4" /> Etiket Ekle
                    </Button>
                  </div>
                </div>
              </FormItem>
              
              <FormField
                control={form.control}
                name="discountRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>İndirim Oranı (%)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="0" 
                        {...field} 
                        value={field.value ?? 0}
                        onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notlar</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Müşteri hakkında notlar..."
                        className="resize-none"
                        {...field} 
                        value={field.value ?? ''}
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
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? "Oluşturuluyor..." : "Müşteri Oluştur"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
