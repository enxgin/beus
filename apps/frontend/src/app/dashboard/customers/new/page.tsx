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
  id?: string; 
  name: string;
  color: string;
}

export default function NewCustomerPage() {
  const router = useRouter()
  const [tags, setTags] = useState<Tag[]>([])
  const [tagInput, setTagInput] = useState('')
  const [tagColor, setTagColor] = useState('#3b82f6')
  
  const { user } = useAuth()
  const userBranch = user?.branch
  
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

  const handleAddTag = () => {
    if (tagInput.trim() !== "") {
      const newTags = [...tags, { name: tagInput.trim(), color: tagColor }]
      setTags(newTags)
      setTagInput('')
    }
  }

  const handleRemoveTag = (index: number) => {
    const newTags = tags.filter((_, i) => i !== index)
    setTags(newTags)
  }

  const onSubmit: SubmitHandler<NewCustomerFormValues> = async (data) => {
    if (!userBranch) {
      toast.error("Kullanıcı şube bilgisi olmadan müşteri oluşturulamaz.")
      return
    }

    const dataToSend = { 
      ...data, 
      branchId: userBranch.id,
      phone: data.phone.replace(/\s/g, ""), // Clean phone number
      email: data.email === '' ? undefined : data.email,
      notes: data.notes === '' ? undefined : data.notes,
    }

    try {
      const response = await api.post("/customers", dataToSend)
      
      if (response.status === 201) {
        toast.success("Müşteri başarıyla oluşturuldu.")
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
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag, index) => (
                      <Badge key={index} variant="outline" style={{ borderColor: tag.color, color: tag.color }}>
                        {tag.name}
                        <button type="button" className="ml-2" onClick={() => handleRemoveTag(index)}>
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      placeholder="Yeni etiket"
                      className="flex-grow"
                    />
                    <Input
                      type="color"
                      value={tagColor}
                      onChange={(e) => setTagColor(e.target.value)}
                      className="w-10 h-10 p-1"
                    />
                    <Button type="button" variant="outline" onClick={handleAddTag}>
                      <Plus className="mr-2 h-4 w-4" /> Ekle
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
