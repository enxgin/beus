"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useState } from "react";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MultiSelect } from "@/components/ui/multi-select";
import { useAuthStore } from "@/stores/auth.store";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import { useEffect, useMemo } from "react";
import { ArrowLeft, Loader2, HomeIcon } from "lucide-react";
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
  categories: { id: string; name: string; branchId: string | null }[];
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
  staff: {
    serviceId: string;
    userId: string;
    user?: {
      id: string;
      name: string;
      email: string;
      role: string;
      branchId: string;
    };
  }[];
  isActive: boolean;
  category?: { id: string; name: string };
}

const EditServicePage = () => {
  const { id } = useParams();
  const { token, user } = useAuthStore();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: apiData, isLoading, error } = useQuery<ApiData>({
    queryKey: ['service', id],
    queryFn: async () => {
      const [serviceData, categoriesData, branchesData] = await Promise.all([
        api.get(`/services/${id}`, { headers: { Authorization: `Bearer ${token}` } }).then(res => res.data),
        api.get('/categories', { headers: { Authorization: `Bearer ${token}` } }).then(res => res.data),
        (user?.role === UserRole.ADMIN || user?.role === UserRole.SUPER_BRANCH_MANAGER) ?
          api.get('/branches', { headers: { Authorization: `Bearer ${token}` } }).then(res => res.data) :
          Promise.resolve(null)
      ]);
      
      // Service yüklendikten sonra staff verilerini al
      const staffData = await api.get('/staff', {
        headers: { Authorization: `Bearer ${token}` },
        params: { branchId: serviceData.branchId }
      }).then(res => res.data);
      
      // Debug: API'den dönen verileri kontrol edelim
      console.log('Service from API:', serviceData);
      console.log('Categories from API:', categoriesData);
      console.log('Staff from API:', staffData);
      console.log('Service staff field:', serviceData.staff);
      
      return { service: serviceData, categories: categoriesData, staff: staffData, branches: branchesData };
    }
  });

  // Form yükleniyor durumunu takip etmek için state
  const [formLoaded, setFormLoaded] = useState(false);
  const [initialValues, setInitialValues] = useState({
    name: '',
    duration: 0,
    price: 0,
    categoryId: '',
    branchId: '',
    staffIds: [] as string[],
    isActive: true,
  });
  
  // Form instance'ini oluştur
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: initialValues,
  });

  // API verisi yüklenince form başlangıç değerlerini ayarla
  useEffect(() => {
    if (apiData?.service && !formLoaded) {
      console.log('API verisi yüklendi, form değerleri ayarlanıyor:', apiData.service);
      
      // Kategori ID'sini kontrol et ve düzelt
      let categoryId = apiData.service.categoryId;
      // API'den gelen veride categoryId boş olabilir ama category nesnesi içinde id olabilir
      if ((!categoryId || categoryId === '') && apiData.service.category?.id) {
        console.log('Kategori ID boş, category nesnesinden alınıyor:', apiData.service.category.id);
        categoryId = apiData.service.category.id;
      }
      
      // Önce başlangıç değerlerini ayarla
      const newInitialValues = {
        name: apiData.service.name,
        duration: apiData.service.duration,
        price: apiData.service.price,
        categoryId: categoryId,
        branchId: apiData.service.branchId,
        staffIds: apiData.service.staff?.map(s => s.user?.id || s.userId).filter(id => id) || [],
        isActive: apiData.service.isActive,
      };
      
      // Başlangıç değerlerini güncelle
      setInitialValues(newInitialValues);
      
      // Form'u resetle
      form.reset(newInitialValues);
      
      setFormLoaded(true);
      console.log('Form değerleri yüklendikten sonra:', form.getValues());
    }
  }, [apiData?.service, form, formLoaded]);

  const onSubmit = async (values: FormValues) => {
    try {
      await api.patch(`/services/${id}`, values, {
        headers: { Authorization: `Bearer ${token}` }
      });
      queryClient.invalidateQueries({ queryKey: ['service'] });
      toast.success('Hizmet başarıyla güncellendi');
      router.push('/dashboard/services');
    } catch (error) {
      console.error('Error updating service:', error);
      toast.error('Hizmet güncellenirken bir hata oluştu');
    }
  };

  const watchedBranchId = form.watch('branchId');

  const categoryOptions = useMemo(() => {
    if (!apiData?.categories) return [];
    
    // Debug: Kategori filtrelerini kontrol edelim
    console.log('Tüm Kategoriler:', apiData.categories);
    console.log('Seçilen Şube ID:', watchedBranchId);
    
    let filtered = [];
    
    // Şube seçilmediyse tüm kategorileri göster
    if (!watchedBranchId) {
      filtered = [...apiData.categories];
      console.log('Şube seçilmedi, tüm kategoriler gösteriliyor');
    } else {
      // Şube seçildiyse, o şubeye ait kategorileri VE şubesi olmayan (genel) kategorileri göster
      filtered = apiData.categories.filter(c => c.branchId === watchedBranchId || c.branchId === null || c.branchId === undefined);
      console.log('Şubeye göre ve genel kategoriler filtrelendi:', filtered);
    }
    
    const selectedCategoryId = form.getValues('categoryId');
    console.log('Seçili Kategori ID:', selectedCategoryId);
    
    // Eğer seçili kategori filtrelenmiş listede yoksa, onu ekle
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
  }, [apiData?.categories, watchedBranchId, form]);

  const staffOptions = useMemo(() => {
    if (!apiData?.staff) return [];
    
    // Şube seçilmediyse boş liste göster
    if (!watchedBranchId) return [];
    
    // Şube seçildiyse, o şubeye ait personeli göster
    const filtered = apiData.staff.filter(s => s.branchId === watchedBranchId);
    
    // Eğer seçili personel varsa ve filtrelenmiş listede yoksa, onları ekle
    const selectedStaffIds = form.getValues('staffIds');
    if (selectedStaffIds && selectedStaffIds.length > 0) {
      selectedStaffIds.forEach(staffId => {
        if (!filtered.some(s => s.id === staffId)) {
          const selectedStaff = apiData.staff.find(s => s.id === staffId);
          if (selectedStaff) {
            filtered.push(selectedStaff);
          }
        }
      });
    }
    
    return filtered.map(s => ({ value: s.id, label: s.name }));
  }, [apiData?.staff, watchedBranchId, form]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-red-500">Hizmet yüklenirken bir hata oluştu.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Breadcrumb>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard">
              <HomeIcon className="h-4 w-4" />
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard/services">Hizmetler</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem isCurrentPage>
            <BreadcrumbLink>Hizmet Düzenle</BreadcrumbLink>
          </BreadcrumbItem>
        </Breadcrumb>
        <div className="flex items-center justify-between mt-2">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Hizmet Düzenle</h1>
            <p className="text-muted-foreground mt-1">
              Hizmet bilgilerini güncelleyin.
            </p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Hizmet Bilgileri</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hizmet Adı</FormLabel>
                      <FormControl>
                        <Input placeholder="Hizmet adını girin" {...field} />
                      </FormControl>
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
                        <Input type="number" {...field} />
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
                      <FormLabel>Fiyat (₺)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {(user?.role === UserRole.ADMIN || user?.role === UserRole.SUPER_BRANCH_MANAGER) && (
                  <FormField
                    control={form.control}
                    name="branchId"
                    render={({ field }) => {
                      console.log('Şube field değeri:', field.value);
                      // Eğer field.value null, undefined veya boş string ise, Select bileşenine undefined değeri gönder
                      // Bu, controlled/uncontrolled geçiş hatasını önler
                      const selectValue = field.value && field.value !== '' ? field.value : undefined;
                      return (
                        <FormItem>
                          <FormLabel>Şube</FormLabel>
                          {formLoaded && (
                            <Select 
                              onValueChange={field.onChange} 
                              value={selectValue}
                            >  
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Şube seçin" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {apiData?.branches?.map((branch) => (
                                  <SelectItem key={branch.id} value={branch.id}>
                                    {branch.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />
                )}

                <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => {
                    console.log('Kategori field değeri:', field.value);
                    console.log('Kategori seçenekleri:', categoryOptions);
                    // Eğer field.value null, undefined veya boş string ise, Select bileşenine undefined değeri gönder
                    // Bu, controlled/uncontrolled geçiş hatasını önler
                    const selectValue = field.value && field.value !== '' ? field.value : undefined;
                    return (
                      <FormItem>
                        <FormLabel>Kategori</FormLabel>
                        {formLoaded && (
                          <Select 
                            onValueChange={field.onChange} 
                            value={selectValue}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Kategori seçin" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {categoryOptions.map((category) => (
                                <SelectItem key={category.value} value={category.value}>
                                  {category.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                        <FormMessage />
                      </FormItem>
                    );
                  }}
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