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

const formSchema = z.object({
  name: z.string().min(2, { message: 'Hizmet adı en az 2 karakter olmalıdır.' }),
  duration: z.coerce.number().min(5, { message: 'Süre en az 5 dakika olmalıdır.' }),
  price: z.coerce.number().min(0, { message: 'Fiyat 0 veya daha büyük olmalıdır.' }),
  categoryId: z.string().min(1, { message: 'Kategori seçimi zorunludur.' }),
  branchId: z.string().min(1, { message: 'Şube seçimi zorunludur.' }),
  staffIds: z.array(z.string()).min(1, { message: 'En az bir personel seçilmelidir.' }),
  isActive: z.boolean().default(true),
});

type FormValues = z.infer<typeof formSchema>;

interface ApiData {
  categories: { id: string; name: string; branchId: string }[];
  staff: { id: string; name: string; branchId: string }[];
  branches: { id: string; name: string }[];
  service: Service;
}

interface Service {
    id: string;
    name: string;
    duration: number;
    price: number;
    categoryId: string;
    branchId: string;
    staff: { id: string }[];
    isActive: boolean;
}

const EditServicePage = () => {
  const { id } = useParams();
  const { token, user } = useAuthStore();
  const queryClient = useQueryClient();
  const router = useRouter();

  const { data: apiData, isLoading, isError } = useQuery<ApiData>({
    queryKey: ['edit-service-data', id],
    queryFn: async () => {
      const [service, categories, staff, branches] = await Promise.all([
        api.get(`/services/${id}`, { headers: { Authorization: `Bearer ${token}` } }).then(res => res.data),
        api.get('/categories', { headers: { Authorization: `Bearer ${token}` } }).then(res => res.data),
        api.get('/staff', { headers: { Authorization: `Bearer ${token}` } }).then(res => res.data),
        user?.role === UserRole.SUPERADMIN ? api.get('/branches', { headers: { Authorization: `Bearer ${token}` } }).then(res => res.data) : Promise.resolve(null)
      ]);
      
      // Debug: API'den dönen kategori verilerini kontrol edelim
      console.log('API Kategori Verileri:', categories);
      
      return { service, categories, staff, branches };
    },
    enabled: !!token && !!id,
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      duration: 0,
      price: 0,
      categoryId: '',
      branchId: '',
      staffIds: [],
      isActive: true,
    },
  });

  useEffect(() => {
    if (apiData?.service) {
      const service = apiData.service;
      form.reset({
        name: service.name,
        duration: service.duration,
        price: service.price,
        categoryId: service.categoryId,
        branchId: service.branchId,
        staffIds: service.staff.map(s => s.id),
        isActive: service.isActive,
      });
    }
  }, [apiData?.service, form]);

  const watchedBranchId = form.watch('branchId');

  const categoryOptions = useMemo(() => {
    if (!apiData?.categories) return [];
    
    // Debug: Kategori filtrelerini kontrol edelim
    console.log('Tüm Kategoriler:', apiData.categories);
    console.log('Seçilen Şube ID:', watchedBranchId);
    
    const filtered = apiData.categories.filter(c => c.branchId === watchedBranchId);
    console.log('Şubeye Göre Filtrelenmiş Kategoriler:', filtered);
    
    const selectedCategoryId = form.getValues('categoryId');
    console.log('Seçili Kategori ID:', selectedCategoryId);
    
    if (selectedCategoryId && !filtered.some(c => c.id === selectedCategoryId)) {
      const selectedCategory = apiData.categories.find(c => c.id === selectedCategoryId);
      if (selectedCategory) {
        filtered.unshift(selectedCategory);
        console.log('Seçili Kategori Eklendi:', selectedCategory);
      }
    }
    
    const result = filtered.map(c => ({ value: c.id, label: c.name }));
    console.log('Son Kategori Seçenekleri:', result);
    
    return result;
  }, [apiData?.categories, watchedBranchId, form.watch('categoryId')]);

  const staffOptions = useMemo(() => {
    if (!apiData?.staff) return [];
    const staffInBranch = apiData.staff.filter(s => s.branchId === watchedBranchId);
    const selectedStaffIds = form.getValues('staffIds') || [];
    const selectedStaffObjects = apiData.staff.filter(s => selectedStaffIds.includes(s.id));
    const combined = [...staffInBranch, ...selectedStaffObjects];
    const uniqueStaff = Array.from(new Map(combined.map(item => [item.id, item])).values());
    return uniqueStaff.map(s => ({ value: s.id, label: s.name }));
  }, [watchedBranchId, apiData?.staff, form.watch('staffIds')]);

  const onSubmit = async (values: FormValues) => {
    try {
      await api.patch(`/services/${id}`, values, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Hizmet başarıyla güncellendi!");
      queryClient.invalidateQueries({ queryKey: ['services'] });
      router.push("/dashboard/services");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Hizmet güncellenirken bir hata oluştu.");
    }
  };

  if (isLoading) return <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  if (isError || !apiData) return <div>Veri yüklenirken bir hata oluştu.</div>;

  return (
    <div className="space-y-4">
      <Button variant="outline" onClick={() => router.back()}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Geri Dön
      </Button>
      <Card>
        <CardHeader>
          <CardTitle>Hizmet Düzenle</CardTitle>
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
                      <FormControl><Input placeholder="Saç Kesimi" {...field} /></FormControl>
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
                      <FormControl><Input type="number" placeholder="30" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fiyat (₺)</FormLabel>
                      <FormControl><Input type="number" placeholder="100" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {user?.role === UserRole.SUPERADMIN && apiData.branches && (
                  <FormField
                    control={form.control}
                    name="branchId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Şube</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Şube seçin" /></SelectTrigger></FormControl>
                          <SelectContent>
                            {apiData.branches.map(branch => (
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
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kategori</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} disabled={!watchedBranchId}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Kategori seçin" /></SelectTrigger></FormControl>
                        <SelectContent>
                          {categoryOptions.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
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
                  name="staffIds"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Personel</FormLabel>
                      <FormControl>
                        <MultiSelect
                          options={staffOptions}
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
                      <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Aktif</FormLabel>
                        <FormDescription>Bu hizmetin aktif olup olmadığını belirtin.</FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Güncelle
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default EditServicePage;
