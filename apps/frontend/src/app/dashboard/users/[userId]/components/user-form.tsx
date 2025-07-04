"use client";

import * as z from "zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-hot-toast";
import axios from "axios";
import { useParams, useRouter } from "next/navigation";

import { Heading } from "@/components/ui/heading";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// API'den gelen veriler için kendi tiplerimi tanımlıyorum
interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  branchId?: string | null;
  branch?: { id: string; name: string } | null;
  createdAt: string;
  updatedAt: string;
}

interface Branch {
  id: string;
  name: string;
  address?: string | null;
  phone?: string | null;
  description?: string | null;
  parentBranchId?: string | null;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

// UserRole enum API formatına uygun olarak tanımlıyoruz
enum UserRole {
  ADMIN = 'ADMIN',
  SUPER_BRANCH_MANAGER = 'SUPER_BRANCH_MANAGER',
  BRANCH_MANAGER = 'BRANCH_MANAGER',
  RECEPTION = 'RECEPTION',
  STAFF = 'STAFF',
  CUSTOMER = 'CUSTOMER',
}

const formSchema = z.object({
  name: z.string().min(2, { message: "İsim en az 2 karakter olmalıdır." }),
  email: z.string().email({ message: "Geçerli bir e-posta adresi giriniz." }),
  password: z.string().min(6, { message: "Şifre en az 6 karakter olmalıdır." }).optional().or(z.literal('')) ,
  role: z.nativeEnum(UserRole, { message: "Lütfen bir rol seçiniz." }),
  branchId: z.string().min(1, { message: "Lütfen bir şube seçiniz." }),
});

type UserFormValues = z.infer<typeof formSchema>;

interface UserFormProps {
  initialData: User | null;
  branches: Branch[];
  roles: { id: string; name: string; }[];
}

export const UserForm: React.FC<UserFormProps> = ({ initialData, branches, roles }) => {
  const params = useParams();
  const router = useRouter();

  const [loading, setLoading] = useState(false);

  const title = initialData ? "Personeli Düzenle" : "Yeni Personel Oluştur";
  const description = initialData
    ? "Mevcut bir personelin bilgilerini düzenleyin."
    : "Yeni bir personel ekleyin.";
  const toastMessage = initialData ? "Personel güncellendi." : "Personel oluşturuldu.";
  const action = initialData ? "Değişiklikleri Kaydet" : "Oluştur";

  const form = useForm<UserFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData
      ? {
          name: initialData.name,
          email: initialData.email,
          branchId: initialData.branchId || '',
          role: initialData?.role || UserRole.STAFF,
          password: '',
        }
      : {
          name: "",
          email: "",
          password: "",
          role: UserRole.STAFF,
          branchId: "",
        },
  });

  // Artık UUID kontrolüne gerek yok, backend CUID'leri kabul ediyor

  const onSubmit = async (data: UserFormValues) => {
    try {
      setLoading(true);
      
      // Veri formatını backend'in beklediği şekilde düzenle
      const payload = {
        name: data.name,
        email: data.email,
        // Boş şifre varsa gönderme
        ...(data.password && data.password !== '' ? { password: data.password } : {}),
        // Role değerini doğru formatta gönder (enum string olarak)
        role: data.role,
        // branchId boşsa gönderme
        ...(data.branchId && data.branchId !== '' ? { branchId: data.branchId } : {})
      };
      
      if (initialData) {
        // Şifre alanını kontrol et - boşsa payload'dan çıkar
        if (!payload.password || payload.password === '') {
          delete payload.password;
        } else if (payload.password && payload.password.length < 6) {
          // Şifre 6 karakterden kısaysa hata göster
          toast.error('Şifre en az 6 karakter olmalıdır');
          setLoading(false);
          return;
        }
        
        try {
          const response = await axios.patch(`http://localhost:3001/api/v1/users/${initialData.id}`, payload);
          
          router.refresh();
          router.push(`/dashboard/users`);
          toast.success(toastMessage);
        } catch (error) {
          throw error; // Hata yakalama blokundaki genel hata işleyicisine gönder
        }
      } else {
        // Yeni kullanıcı oluşturma
        // Şifre alanını kontrol et - yeni kullanıcı için şifre zorunlu
        if (!payload.password || payload.password === '') {
          toast.error('Yeni kullanıcı için şifre zorunludur');
          setLoading(false);
          return;
        } else if (payload.password && payload.password.length < 6) {
          toast.error('Şifre en az 6 karakter olmalıdır');
          setLoading(false);
          return;
        }
        
        try {
          const response = await axios.post(`http://localhost:3001/api/v1/users`, payload);
          
          router.refresh();
          router.push(`/dashboard/users`);
          toast.success(toastMessage);
        } catch (error) {
          throw error; // Hata yakalama blokundaki genel hata işleyicisine gönder
        }
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        
        // Hata mesajını ayrıştır
        let errorMessage = "Bir şeyler ters gitti.";
        if (error.response.data) {
          if (Array.isArray(error.response.data.message)) {
            errorMessage = `Hata: ${error.response.data.message.join(', ')}`;
          } else if (typeof error.response.data.message === 'string') {
            errorMessage = `Hata: ${error.response.data.message}`;
          } else if (typeof error.response.data === 'string') {
            errorMessage = `Hata: ${error.response.data}`;
          }
        }
        
        toast.error(errorMessage);
      } else {
        console.error('Bilinmeyen hata:', error);
        toast.error("Bir şeyler ters gitti.");
      }
      
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <Heading title={title} description={description} />
      </div>
      <Separator />
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 w-full">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>İsim Soyisim</FormLabel>
                  <FormControl>
                    <Input disabled={loading} placeholder="Personelin adı ve soyadı" {...field} />
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
                    <Input type="email" disabled={loading} placeholder="E-posta adresi" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Şifre</FormLabel>
                  <FormControl>
                    <Input type="password" disabled={loading} placeholder={initialData ? "Değiştirmek için yeni şifre girin" : "Yeni şifre"} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="branchId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Şube</FormLabel>
                  <Select disabled={loading} onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Bir şube seçin" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {branches.map((branch) => (
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
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rol</FormLabel>
                  <Select disabled={loading} onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Bir rol seçin" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem key={role.id} value={role.id}>
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <Button disabled={loading} className="ml-auto" type="submit">
            {action}
          </Button>
        </form>
      </Form>
    </>
  );
};
