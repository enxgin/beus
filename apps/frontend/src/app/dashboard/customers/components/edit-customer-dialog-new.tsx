"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { customerSchema } from "../data/schema"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { useEffect, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import api from "@/lib/api"
import { Badge } from "@/components/ui/badge"
import { X, Plus } from "lucide-react"
import { useQuery } from "@tanstack/react-query"

// Tag tipi tanımı
type Tag = {
  id: string
  name: string
  color: string
}

// Form şeması
const editCustomerSchema = z.object({
  name: z.string().min(2, { message: "İsim en az 2 karakter olmalıdır." }),
  email: z.string().email({ message: "Geçerli bir e-posta adresi giriniz." }).optional().or(z.literal('')),
  phone: z
    .string()
    .regex(
      /^(\+90|0)\s*[5-9][0-9]{2}\s*[0-9]{3}\s*[0-9]{2}\s*[0-9]{2}$/,
      { message: "Geçerli bir Türkiye telefon numarası giriniz. Örn: +905551234567 veya 05551234567" }
    ),
  notes: z.string().optional().or(z.literal('')),
  discountRate: z.coerce.number().min(0).max(100).optional(),
})

type EditCustomerFormValues = z.infer<typeof editCustomerSchema>

interface EditCustomerDialogProps {
  customer: z.infer<typeof customerSchema>
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditCustomerDialog({ customer, open, onOpenChange }: EditCustomerDialogProps) {
  const queryClient = useQueryClient()
  const [formLoaded, setFormLoaded] = useState(false)
  
  // Tüm etiketleri API'den çek
  const { data: allTags = [] } = useQuery<Tag[]>({
    queryKey: ['tags'],
    queryFn: async () => {
      const response = await api.get('/tags')
      return response.data
    },
    staleTime: 5 * 60 * 1000, // 5 dakika önbelleğe al
  })
  
  // Seçili etiketleri tutan state
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [tagColor, setTagColor] = useState('#3b82f6')
  
  // Form için varsayılan değerleri hazırla
  const form = useForm<EditCustomerFormValues>({
    resolver: zodResolver(editCustomerSchema),
    defaultValues: {
      name: customer?.name || '',
      email: customer?.email || '',
      phone: customer?.phone || '',
      notes: customer?.notes || '',
      discountRate: customer?.discountRate || 0,
    },
  })
  
  // Müşteri yüklendiğinde seçili etiketleri ayarla
  useEffect(() => {
    if (customer?.tags) {
      console.log('Müşteri verileri:', customer)
      console.log('Müşteri etiketleri (ham):', customer.tags)
      
      // Etiket ID'lerini çıkar
      const tagIds: string[] = []
      
      if (Array.isArray(customer.tags)) {
        customer.tags.forEach((tagItem: any) => {
          // CustomerTag formatında (tag alt nesnesi içinde)
          if (tagItem.tag && tagItem.tag.id) {
            tagIds.push(tagItem.tag.id)
          }
          // Doğrudan Tag nesnesi ise
          else if (tagItem.id && !tagItem.customerId && !tagItem.tagId) {
            tagIds.push(tagItem.id)
          }
          // CustomerTag formatında (tagId içeriyorsa)
          else if (tagItem.tagId) {
            tagIds.push(tagItem.tagId)
          }
        })
      }
      
      console.log('Çıkarılan etiket ID\'leri:', tagIds)
      setSelectedTagIds(tagIds)
    }
  }, [customer])
  
  // Form değerlerini yükle - controlled/uncontrolled hatalarını önlemek için setTimeout kullan
  useEffect(() => {
    if (open && customer && !formLoaded) {
      setTimeout(() => {
        form.reset({
          name: customer.name || '',
          phone: customer.phone || '',
          email: customer.email || '',
          notes: customer.notes || '',
          discountRate: customer.discountRate || 0,
        })
        setFormLoaded(true)
      }, 0)
    } else if (!open) {
      setFormLoaded(false)
    }
  }, [open, customer, form, formLoaded])
  
  // Form gönderimi
  const onSubmit = async (data: EditCustomerFormValues) => {
    try {
      const phoneWithoutSpaces = data.phone.replace(/\s/g, '')
      
      // Gönderilecek veriyi hazırla
      const submissionData = {
        ...data,
        phone: phoneWithoutSpaces,
        email: data.email === '' ? undefined : data.email,
        notes: data.notes === '' ? undefined : data.notes,
        tagIds: selectedTagIds, // Seçili etiket ID'lerini gönder
      }
      
      console.log('Gönderilecek veri:', submissionData)
      await api.patch(`/customers/${customer.id}`, submissionData)
      toast.success("Müşteri başarıyla güncellendi.")
      queryClient.invalidateQueries({ queryKey: ["customers"] })
      queryClient.invalidateQueries({ queryKey: ["customer", customer.id] })
      onOpenChange(false)
    } catch (error) {
      console.error("Failed to update customer:", error)
      toast.error("Müşteri güncellenirken bir hata oluştu.")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Müşteri Düzenle</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>İsim</FormLabel>
                  <FormControl>
                    <Input placeholder="Müşteri adı..." {...field} />
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
                  <FormLabel>Telefon</FormLabel>
                  <FormControl>
                    <Input placeholder="+90 555 123 45 67" {...field} />
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
                  <FormLabel>E-posta</FormLabel>
                  <FormControl>
                    <Input placeholder="ornek@email.com" {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
                      onChange={(e) => field.onChange(e.target.valueAsNumber)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Etiketler Alanı */}
            <div className="space-y-2">
              <FormLabel>Etiketler</FormLabel>
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
                      onClick={() => setSelectedTagIds(selectedTagIds.filter(id => id !== tag.id))}
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
                  onClick={async () => {
                    if (tagInput.trim()) {
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
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" /> Etiket Ekle
                </Button>
              </div>
            </div>
            
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
            <DialogFooter>
              <Button type="submit">Değişiklikleri Kaydet</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
