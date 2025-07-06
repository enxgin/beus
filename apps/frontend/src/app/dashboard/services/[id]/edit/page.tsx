"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MultiSelect } from "@/components/ui/multi-select";
import { useAuthStore } from "@/stores/auth.store";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import { useEffect, useMemo } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { UserRole } from "@/types/user";

// Form şeması tanımı
const formSchema = z.object({
  name: z.string().min(2, { message: 'Hizmet adı en az 2 karakter olmalıdır.' }),
  duration: z.coerce.number().min(5, { message: 'Süre en az 5 dakika olmalıdır.' }),
  price: z.coerce.number().min(0, { message: 'Fiyat 0 veya daha büyük olmalıdır.' }),
  categoryId: z.string().min(1, { message: 'Kategori seçimi zorunludur.' }),
  branchId: z.string().min(1, { message: 'Şube seçimi zorunludur.' }),
  staffIds: z.array(z.string()).min(1, { message: 'En az bir personel seçilmelidir.' }),
  isActive: z.boolean().default(true),
});

// Form için tip tanımı
type FormValues = z.infer<typeof formSchema>;

interface ApiData {
  categories: { id: string; name: string }[];
  staff: { id: string; name: string; branchId: string }[];
  branches: { id: string; name: string }[];
}

const EditServicePage = () => {
  const router = useRouter();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);

  // Sadece ADMIN rolü şube seçebilir
  const canSelectBranch = user?.role === UserRole.ADMIN;
  
  // Form tanımı
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      duration: 0,
      price: 0,
      categoryId: "",
      branchId: "",
      staffIds: [] as string[],
      isActive: true,
    } as FormValues,
  });

  // Hizmet verilerini getirme
  const { data: service, isLoading: isServiceLoading } = useQuery({
    queryKey: ["service", id],
    queryFn: async () => {
      const response = await api.get(`/services/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    },
    enabled: !!id && !!token,
  });

  // Kategori, personel ve şube verilerini getirme
  const { data: apiData, isLoading: isApiDataLoading } = useQuery({
    queryKey: ["service-edit-data"],
    queryFn: async () => {
      const [categoriesRes, staffRes, branchesRes] = await Promise.all([
        api.get("/categories", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
        api.get("/staff", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
        api.get("/branches", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
      ]);

      return {
        categories: categoriesRes.data,
        staff: staffRes.data,
        branches: branchesRes.data,
      } as ApiData;
    },
    enabled: !!token,
  });

  // Form verilerini doldurma
  useEffect(() => {
    if (service) {
      form.reset({
        name: service.name,
        duration: service.duration,
        price: service.price,
        categoryId: service.categoryId,
        branchId: service.branchId,
        staffIds: service.staffIds,
        isActive: service.isActive,
      } as FormValues);
    }
  }, [service, form]);

  // Şubeye göre personel filtreleme
  const filteredStaff = useMemo(() => {
    if (!apiData?.staff) return [];
    const branchId = form.watch("branchId");
    if (!branchId) return [];
    return apiData.staff.filter((staff) => staff.branchId === branchId);
  }, [apiData?.staff, form.watch("branchId")]);

  // Form gönderimi
  const handleSubmit = async (data: FormValues) => {
    try {
      await api.put(
        `/services/${id}`,
        {
          ...data,
          duration: Number(data.duration),
          price: Number(data.price),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      toast.success("Hizmet başarıyla güncellendi");
      queryClient.invalidateQueries({ queryKey: ["service", id] });
      queryClient.invalidateQueries({ queryKey: ["services"] });
      router.push("/dashboard/services");
    } catch (error) {
      console.error(error);
      toast.error("Hizmet güncellenirken bir hata oluştu");
    }
  };

  if (isServiceLoading || isApiDataLoading) {
    return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="p-4">
      <Button variant="ghost" onClick={() => router.back()} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Geri
      </Button>
      <Card>
        <CardHeader>
          <CardTitle>Hizmeti Düzenle</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hizmet Adı</FormLabel>
                      <FormControl>
                        <Input placeholder="Örn: Saç Kesimi" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kategori</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Kategori seçin" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {apiData?.categories?.map((category: { id: string; name: string }) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
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
                  name="duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Süre (dakika)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="Örn: 30" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fiyat (TL)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="Örn: 150" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {canSelectBranch && (
                  <FormField
                    control={form.control}
                    name="branchId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Şube</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Şube seçin" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {apiData?.branches?.map((branch: { id: string; name: string }) => (
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
                  name="staffIds"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bu Hizmeti Verebilecek Personeller</FormLabel>
                      <FormControl>
                        <MultiSelect
                          options={filteredStaff.map((s) => ({ label: s.name, value: s.id }))}
                          selected={field.value || []}
                          onChange={field.onChange}
                          placeholder="Personel seçin"
                          emptyIndicator={form.watch("branchId") ? "Bu şubede personel bulunamadı." : "Önce şube seçmelisiniz."}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Hizmet Aktif</FormLabel>
                        <FormDescription>
                          Hizmetin randevu sisteminde görünür olup olmadığını belirler.
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
              <div className="flex justify-end pt-4">
                <Button variant="outline" type="button" onClick={() => router.back()} className="mr-2">
                  İptal
                </Button>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Değişiklikleri Kaydet
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default EditServicePage;
