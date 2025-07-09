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
import { customerSchema, Tag as TagType } from "../data/schema"
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

// Define the form schema using Zod
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
  tags: z.array(z.object({
    id: z.string().optional(),
    name: z.string(),
    color: z.string().optional(),
  })).optional(),
  discountRate: z.coerce.number().min(0).max(100).optional(),
})

type EditCustomerFormValues = z.infer<typeof editCustomerSchema>

interface EditCustomerDialogProps {
  customer: z.infer<typeof customerSchema>
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditCustomerDialog({ customer, open, onOpenChange }: EditCustomerDialogProps) {
  console.log('EditCustomerDialog props:', { customer, open })
  console.log('Müşteri etiketleri:', customer.tags)
  
  const queryClient = useQueryClient()
  
  // Etiketleri işlerken boş olma durumunu kontrol et
  const [tags, setTags] = useState<TagType[]>([])
  const [tagInput, setTagInput] = useState('')
  const [tagColor, setTagColor] = useState('#000000')
  
  // Bileşen mount olduğunda ve müşteri değiştiğinde etiketleri normalize et
  useEffect(() => {
    if (customer) {
      // API'den gelen etiketleri normalize et - farklı formatları destekle
      let normalizedTags: TagType[] = [];
      
      if (customer.tags && Array.isArray(customer.tags)) {
        normalizedTags = customer.tags.map((tagItem: any, index: number) => {
          // API yanıt formatına uygun olarak tag alt nesnesini al
          const tagObj = tagItem.tag || tagItem;
          
          // Tag bir string ise
          if (typeof tagObj === 'string') {
            return { id: `existing-${index}`, name: tagObj, color: '#3b82f6' };
          }
          // Tag bir nesne ise
          else if (typeof tagObj === 'object' && tagObj !== null) {
            return { 
              id: tagObj.id || tagItem.id || `existing-${index}`,
              name: tagObj.name || `Etiket ${index+1}`, 
              color: tagObj.color || '#3b82f6'
            };
          }
          return null;
        }).filter(Boolean) as TagType[];
      }
      
      console.log('Normalize edilmiş etiketler:', normalizedTags);
      setTags(normalizedTags);
    }
  }, [customer])

  const form = useForm<EditCustomerFormValues>({
    resolver: zodResolver(editCustomerSchema),
    defaultValues: {
      name: customer.name ?? '',
      phone: customer.phone ?? '',
      email: customer.email ?? '',
      notes: customer.notes ?? '',
      discountRate: customer.discountRate ?? 0,
      tags: customer.tags ?? [],
    },
  })

  useEffect(() => {
    if (open) {
      form.reset({
        name: customer.name ?? '',
        phone: customer.phone ?? '',
        email: customer.email ?? '',
        notes: customer.notes ?? '',
        discountRate: customer.discountRate ?? 0,
        tags: tags, // Normalize edilmiş etiketleri kullan
      })
      
      // Etiketler zaten diğer useEffect'te normalize edilip set edildi
      // setTags burada tekrar çağrılmaz - bu controlled/uncontrolled uyarılarını önler
    }
  }, [open, customer, form, tags])

  useEffect(() => {
    form.setValue('tags', tags)
  }, [tags, form])

  const onSubmit = async (data: EditCustomerFormValues) => {
    const phoneWithoutSpaces = data.phone.replace(/\s/g, '');
    const { tags, ...restData } = data;
    
    // Sadece veritabanında kayıtlı olan etiketlerin ID'lerini al
    // Geçici ID'ler (new- ile başlayan) filtreleniyor
    const existingTagIds = tags
      ?.filter(tag => !!tag.id && !String(tag.id).startsWith('new-'))
      .map(tag => tag.id as string)
      || [];
      
    console.log('Mevcut etiket ID\'leri:', existingTagIds);
    
    const submissionData = {
      ...restData,
      phone: phoneWithoutSpaces,
      email: data.email === '' ? undefined : data.email,
      notes: data.notes === '' ? undefined : data.notes,
      tagIds: existingTagIds, // Backend'e sadece var olan etiket ID'lerini gönder
    };

    try {
      console.log('Gönderilecek veri:', submissionData);
      await api.patch(`/customers/${customer.id}`, submissionData);
      toast.success("Müşteri başarıyla güncellendi.");
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["customer", customer.id] });
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to update customer:", error);
      toast.error("Müşteri güncellenirken bir hata oluştu.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Müşteri Düzenle</DialogTitle>
          <DialogDescription>
            Müşteri bilgilerini güncelleyin.
          </DialogDescription>
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
                    <Input placeholder="Müşteri adı" {...field} />
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
                    <Input placeholder="+90 555 123 4567" {...field} />
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
                  <FormLabel>E-posta (İsteğe bağlı)</FormLabel>
                  <FormControl>
                    <Input placeholder="musteri@example.com" {...field} value={field.value ?? ''} />
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
                    <Input type="number" placeholder="0" {...field} value={field.value ?? 0} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="tags"
              render={() => (
                <FormItem>
                  <FormLabel>Etiketler</FormLabel>
                  <div className="flex flex-col gap-2">
                    <div className="flex flex-wrap gap-2">
                      {Array.isArray(tags) && tags.length > 0 ? (
                        tags.map((tag, index) => {
                          if (!tag) return null;
                          
                          // Her etiketin name ve color özelliklerini güvenli bir şekilde al
                          const name = tag.name || '';
                          const color = tag.color || '#3b82f6';
                          const key = tag.id || `tag-${index}`;
                          
                          if (!name) return null;
                          
                          return (
                            <Badge 
                              key={key} 
                              variant="outline" 
                              style={{ 
                                backgroundColor: color, 
                                color: '#fff', 
                                borderColor: color 
                              }}
                            >
                              {name}
                              <button
                                type="button"
                                className="ml-2 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                onClick={() => setTags(tags.filter((_, i) => i !== index))}
                              >
                                <X className="h-3 w-3 text-white hover:text-gray-200" />
                              </button>
                            </Badge>
                          );
                        })
                      ) : (
                        <div className="text-sm text-muted-foreground">Etiket yok</div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="text"
                        placeholder="Yeni etiket ekle..."
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
                      onClick={() => {
                        if (tagInput.trim()) {
                          // Yeni etiket eklerken id, name ve color ekle
                          const newTag: TagType = { 
                            id: `new-${Date.now()}`, 
                            name: tagInput.trim(), 
                            color: tagColor || '#3b82f6' 
                          };
                          setTags([...tags, newTag]);
                          setTagInput('');
                          
                          // Form değerini de güncelle
                          form.setValue('tags', [...tags, newTag]);
                        }
                      }}
                    >
                      <Plus className="mr-2 h-4 w-4" /> Etiket Ekle
                    </Button>
                  </div>
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
            <DialogFooter>
              <Button type="submit">Değişiklikleri Kaydet</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
