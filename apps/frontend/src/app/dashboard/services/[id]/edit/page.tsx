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

const formSchema = z.object({
  name: z.string().min(2, { message: 'Hizmet adı en az 2 karakter olmalıdır.' }),
  duration: z.coerce.number().min(5, { message: 'Süre en az 5 dakika olmalıdır.' }),
  price: z.coerce.number().min(0, { message: 'Fiyat 0 veya daha büyük olmalıdır.' }),
  categoryId: z.string().min(1, { message: 'Kategori seçimi zorunludur.' }),
  branchId: z.string().min(1, { message: 'Şube seçimi zorunludur.' }),
  staffIds: z.array(z.string()).min(1, { message: 'En az bir personel seçilmelidir.' }),
  isActive: z.boolean().default(true),
});

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

  const canSelectBranch = user?.role === 'ADMIN' || user?.role === 'OWNER';

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      duration: 30,
      price: 0,
      categoryId: "",
      branchId: canSelectBranch ? "" : user?.branchId,
      staffIds: [],
      isActive: true,
    },
  });

  const { data: formData, isLoading: isFormDataLoading } = useQuery<ApiData>({
    queryKey: ["service-form-data", user?.id],
    queryFn: async () => {
      if (!token) return { categories: [], staff: [], branches: [] };
      try {
        const requests = [
          api.get("/service-categories", { headers: { Authorization: `Bearer ${token}` } }),
          api.get("/staff", { headers: { Authorization: `Bearer ${token}` } }),
        ];

        if (canSelectBranch) {
          requests.push(api.get("/branches", { headers: { Authorization: `Bearer ${token}` } }));
        }

        const responses = await Promise.all(requests);
        
        return {
          categories: responses[0].data,
          staff: responses[1].data,
          branches: canSelectBranch ? responses[2].data : [],
        };
      } catch (error) {
        toast.error("Form verileri yüklenirken bir hata oluştu.");
        return { categories: [], staff: [], branches: [] };
      }
    },
    enabled: !!token,
  });

  useEffect(() => {
    const fetchService = async () => {
      if (id && token) {
        try {
          const { data: service } = await api.get(`/services/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          form.reset({
            name: service.name,
            duration: service.duration,
            price: service.price,
            categoryId: service.categoryId,
            branchId: service.branchId,
            staffIds: service.staff?.map((s: any) => s.id) || [],
            isActive: service.isActive,
          });
        } catch (error) {
          toast.error("Hizmet bilgileri yüklenirken bir hata oluştu.");
        }
      }
    };
    fetchService();
  }, [id, token, form]);

  const watchedBranchId = form.watch('branchId');

  const filteredStaff = useMemo(() => {
    if (!watchedBranchId || !formData?.staff) return [];
    return formData.staff.filter((s) => s.branchId === watchedBranchId);
  }, [watchedBranchId, formData?.staff]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const toastId = toast.loading('Hizmet güncelleniyor...');
    try {
      await api.patch(`/services/${id}`, values, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Hizmet başarıyla güncellendi.', { id: toastId });
      queryClient.invalidateQueries({ queryKey: ['services'] });
      queryClient.invalidateQueries({ queryKey: ['service', id] });
      router.push('/dashboard/services');
    } catch (error) {
      toast.error('Hizmet güncellenirken bir hata oluştu.', { id: toastId });
    }
  };

  if (isFormDataLoading) {
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
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
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
                          {formData?.categories?.map((category) => (
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
                            {formData?.branches?.map((branch) => (
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
                          emptyIndicator={watchedBranchId ? "Bu şubede personel bulunamadı." : "Önce şube seçmelisiniz."}
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
