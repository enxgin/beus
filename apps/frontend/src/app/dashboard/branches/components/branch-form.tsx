"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { type Branch } from "./columns" // type import

// Zod şeması, backend DTO'suna göre oluşturuldu.
const formSchema = z.object({
  name: z.string().min(2, { message: "Şube adı en az 2 karakter olmalıdır." }),
  phone: z.string().min(10, { message: "Geçerli bir telefon numarası giriniz." }),
  address: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  parentBranchId: z.string().nullable().optional(), // Boş string null olarak yorumlanacak
})

export type BranchFormValues = z.infer<typeof formSchema>

interface BranchFormProps {
  initialData?: Partial<Branch> | null;
  branches: Branch[]; // Üst şube seçimi için
  onSubmit: (values: BranchFormValues) => void;
  isLoading: boolean;
}

export function BranchForm({ initialData, branches, onSubmit, isLoading }: BranchFormProps) {
  // Form gönderilirken `parentBranchId`'yi işle
    const handleFormSubmit = (values: BranchFormValues) => {
    const processedValues = {
      ...values,
      // "null-value" stringini backend'e göndermeden önce null'a çevir.
      parentBranchId: values.parentBranchId === 'null-value' ? null : values.parentBranchId,
    }
    onSubmit(processedValues)
  }

  const form = useForm<BranchFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name || '',
      phone: initialData?.phone || '',
      address: initialData?.address || null,
      description: initialData?.description || null,
      parentBranchId: initialData?.parentBranchId || null,
    },
  })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Şube Adı</FormLabel>
              <FormControl>
                <Input placeholder="Merkez Şube" {...field} disabled={isLoading} />
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
                <Input placeholder="+90..." {...field} disabled={isLoading} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
                <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Adres (Opsiyonel)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Şube adresi..."
                  className="resize-none"
                  disabled={isLoading}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  name={field.name}
                  ref={field.ref}
                  value={field.value ?? ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Açıklama (Opsiyonel)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Şube hakkında notlar..."
                  className="resize-none"
                  disabled={isLoading}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  name={field.name}
                  ref={field.ref}
                  value={field.value ?? ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="parentBranchId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Üst Şube (Opsiyonel)</FormLabel>
              <Select onValueChange={field.onChange} value={field.value ?? 'null-value'} disabled={isLoading}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Bir üst şube seçin" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="null-value">Üst Şubesi Yok</SelectItem>
                  {/* Kendisini üst şube olarak seçmesini engellemek için filtreleme */}
                  {branches.filter(branch => branch.id !== initialData?.id).map((branch) => (
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
        <Button disabled={isLoading} className="ml-auto" type="submit">
          {initialData ? 'Değişiklikleri Kaydet' : 'Oluştur'}
        </Button>
      </form>
    </Form>
  )
}
