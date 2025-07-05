"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { customerSchema, branchSchema } from "../data/schema"
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
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import api from "@/lib/api"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { X, Plus } from "lucide-react"

// Define the form schema using Zod
const editCustomerSchema = z.object({
  name: z.string().min(2, { message: "İsim en az 2 karakter olmalıdır." }),
  // Türkiye telefon numarası formatı için regex
  // +90 ile başlayan veya 0 ile başlayan formatları kabul eder
  phone: z
    .string()
    .regex(
      /^(\+90|0)\s*[5-9][0-9]{2}\s*[0-9]{3}\s*[0-9]{2}\s*[0-9]{2}$/, 
      { message: "Geçerli bir Türkiye telefon numarası giriniz. Örn: +905551234567 veya 05551234567" }
    ),
  notes: z.string().optional().or(z.literal('')),
  branchId: z.string().min(1, { message: "Lütfen bir şube seçin." }),
  tags: z.array(z.object({
    name: z.string(),
    color: z.string()
  })).optional(),
  discountRate: z.preprocess(
    (val) => (val === "" ? 0 : Number(val)),
    z.number().min(0).max(100)
  ),
})

type EditCustomerFormValues = z.infer<typeof editCustomerSchema>

interface EditCustomerDialogProps {
  customer: z.infer<typeof customerSchema>
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
}

export function EditCustomerDialog({ customer, isOpen, onOpenChange }: EditCustomerDialogProps) {
  const queryClient = useQueryClient()
  const [tags, setTags] = useState<{ name: string; color: string }[]>([])
  const [tagInput, setTagInput] = useState('')
  const [tagColor, setTagColor] = useState('#3b82f6')
  
  // Şube listesini çek
  const { data: branchesData } = useQuery({
    queryKey: ["branches"],
    queryFn: async () => {
      try {
        const response = await api.get("/branches");
        return response.data; // Returns { data: [], total: 0 }
      } catch (error) {
        console.error("Failed to fetch branches:", error);
        return { data: [], total: 0 }; // Return the correct structure on error
      }
    },
    enabled: isOpen, // Sadece dialog açıkken çalışsın
  });

  const branches = branchesData?.data || [];
  
  // Artık etiketleri API'den çekmiyoruz, kullanıcı yeni etiket ekleyebilecek
  
  const form = useForm<EditCustomerFormValues>({
    resolver: zodResolver(editCustomerSchema) as any,
    defaultValues: {
      name: "",
      phone: "",
      notes: "",
      branchId: "",
      tags: [],
      discountRate: 0,
    },
  })

  // When the dialog opens, populate the form with the customer's data
  useEffect(() => {
    if (isOpen && customer) {
      form.reset({
        name: customer.name,
        phone: customer.phone,
        notes: customer.notes || "",
        branchId: customer.branch?.id || "",
        discountRate: customer.discountRate || 0,
        tags: customer.tags?.map(tag => ({
          name: tag.name,
          color: tag.color || '#3b82f6'
        })) || [],
      })
      
      // Set existing tags
      if (customer.tags && customer.tags.length > 0) {
        setTags(customer.tags.map(tag => ({
          name: tag.name,
          color: tag.color || '#3b82f6'
        })))
      } else {
        setTags([])
      }
    }
  }, [isOpen, customer, form])

  const onSubmit = async (values: EditCustomerFormValues) => {
    if (!customer) return

    try {
      // Telefon numarasını formatlayalım (boşlukları kaldıralım)
      // Backend'in beklediği formatı oluşturalım
      const formattedValues = {
        name: values.name,
        phone: values.phone.replace(/\s+/g, ''),
        branchId: values.branchId,
        notes: values.notes,
        discountRate: values.discountRate || 0,
        // Artık etiketleri doğrudan gönderebiliriz
        tags: tags
      }

      // API isteğini gönderelim
      await api.patch(`/customers/${customer.id}`, formattedValues)
      
      // Başarılı olduğunda
      toast.success('Müşteri bilgileri başarıyla güncellendi.')
      queryClient.invalidateQueries({ queryKey: ["customers"] })
      queryClient.invalidateQueries({ queryKey: ["customer", customer.id] })
      onOpenChange(false) // Diyalogu kapat
    } catch (error: any) {
      // Hata detaylarını göster
      console.error('Güncelleme hatası:', error)
      
      // API'den gelen hata mesajını göster (varsa)
      const errorMessage = error.response?.data?.message || 'Müşteri bilgileri güncellenirken bir hata oluştu.'
      toast.error(errorMessage)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Müşteri Düzenle</DialogTitle>
          <DialogDescription>
            Müşteri bilgilerini güncelleyin. Tamamladığınızda kaydet'e tıklayın.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-4">
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
            <FormField
              control={form.control as any}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefon</FormLabel>
                  <FormControl>
                    <Input placeholder="Telefon" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control as any}
              name="branchId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Şube</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Şube seçin" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {branches?.map((branch: any) => (
                        <SelectItem key={branch.id} value={branch.id}>
                          {branch.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
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
            <DialogFooter>
              <Button type="submit">Değişiklikleri Kaydet</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
