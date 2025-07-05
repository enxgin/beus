"use client";

import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-hot-toast";
import { useParams, useRouter } from "next/navigation";
import { isAxiosError } from "axios";

import { useCreateUser, useUpdateUser } from "../../hooks/use-users";
import { useAuthStore } from "@/stores/auth.store";
import { Heading } from "@/components/ui/heading";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserRole, User } from "@/types/user";

// Merkezi tiplerden bağımsız lokal tipler
interface Branch {
  id: string;
  name: string;
}

const formSchema = z.object({
  name: z.string().min(2, { message: "İsim en az 2 karakter olmalıdır." }),
  email: z.string().email({ message: "Geçerli bir e-posta adresi giriniz." }),
  password: z.string().min(6, { message: "Şifre en az 6 karakter olmalıdır." }).optional().or(z.literal('')),
  // Backend role değerleri string olarak geliyor, enum olarak doğrulama yapıyoruz
  role: z.string().refine(val => Object.values(UserRole).includes(val as UserRole), {
    message: "Lütfen geçerli bir rol seçiniz."
  }),
  branchId: z.string().optional(),
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
  const { user: currentUser } = useAuthStore();

  const createUser = useCreateUser();
  const updateUser = useUpdateUser(params.userId as string);

  const isPending = createUser.isPending || updateUser.isPending;

  const title = initialData ? "Personeli Düzenle" : "Yeni Personel Oluştur";
  const description = initialData ? "Mevcut bir personelin bilgilerini düzenleyin." : "Yeni bir personel ekleyin.";
  const toastMessage = initialData ? "Personel güncellendi." : "Personel oluşturuldu.";
  const action = initialData ? "Güncelle" : "Oluştur";

  // Form için gerekli değerleri ayarla
  const defaultValues = initialData ? {
    name: initialData.name,
    email: initialData.email,
    password: "", // Düzenleme durumunda şifre boş bırakılabilir
    role: initialData.role,
    branchId: initialData.branchId || undefined,
  } : {
    name: "",
    email: "",
    password: "",
    role: "" as UserRole,
    branchId: "",
  };
  
  const form = useForm<UserFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues
  });

  const onSubmit = (data: UserFormValues) => {
    try {
      // Role değerini UserRole tipine dönüştür ve branch bilgisini ekle
      const payload: any = {
        ...data,
        role: data.role,
        branch: {} // User tipinin gerektirdiği boş branch nesnesi
      };

      if (!initialData) {
        // Yeni kullanıcı durumunda şifre zorunludur
        if (!payload.password) {
          toast.error("Yeni kullanıcı için şifre zorunludur.");
          return;
        }
      } else if (payload.password === "") {
        // Düzenleme durumunda boş şifre gelirse, password alanını kaldır
        delete payload.password;
      }

      const handleSuccess = () => {
        toast.success(toastMessage);
        router.push("/dashboard/users");
      };
      
      const handleError = (error: any) => {
        if (isAxiosError(error) && error.response) {
          const responseData = error.response.data;
          const message = Array.isArray(responseData.message)
            ? responseData.message.join(', ')
            : responseData.message || "Bir hata oluştu.";
          toast.error(`Hata: ${message}`);
        } else {
          toast.error("Bilinmeyen bir hata oluştu.");
        }
      };

      if (initialData) {
        updateUser.mutate(payload, { onSuccess: handleSuccess, onError: handleError });
      } else {
        if (!payload.password) {
          toast.error("Yeni kullanıcı için şifre zorunludur.");
          return;
        }
        createUser.mutate(payload, { onSuccess: handleSuccess, onError: handleError });
      }
    } catch (error) {
      console.error(error);
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
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>İsim</FormLabel>
                  <FormControl>
                    <Input disabled={isPending} placeholder="Ad Soyad" {...field} />
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
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input disabled={isPending} placeholder="ornek@email.com" {...field} />
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
                  <FormLabel>{initialData ? "Şifre (Değiştirmek için girin)" : "Şifre"}</FormLabel>
                  <FormControl>
                    <Input disabled={isPending} type="password" placeholder="********" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* Şube alanı - sadece admin ve üst şube yöneticileri için */}
            {(currentUser?.role === UserRole.ADMIN || currentUser?.role === UserRole.SUPER_BRANCH_MANAGER) && (
              <FormField
                control={form.control}
                name="branchId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Şube</FormLabel>
                    <Select disabled={isPending} onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
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
            )}
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rol</FormLabel>
                  <Select disabled={isPending} onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
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
          <Button disabled={isPending} className="ml-auto" type="submit">
            {action}
          </Button>
        </form>
      </Form>
    </>
  );
};