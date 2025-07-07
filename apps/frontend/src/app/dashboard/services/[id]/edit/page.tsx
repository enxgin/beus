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

// Form schema definition
const formSchema = z.object({
  name: z.string().min(2, { message: 'Hizmet adı en az 2 karakter olmalıdır.' }),
  duration: z.coerce.number().min(5, { message: 'Süre en az 5 dakika olmalıdır.' }),
  price: z.coerce.number().min(0, { message: 'Fiyat 0 veya daha büyük olmalıdır.' }),
  categoryId: z.string().min(1, { message: 'Kategori seçimi zorunludur.' }),
  branchId: z.string().min(1, { message: 'Şube seçimi zorunludur.' }),
  staffIds: z.array(z.string()).min(1, { message: 'En az bir personel seçilmelidir.' }),
  isActive: z.boolean().default(true),
});

// Form type definition
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

  const canSelectBranch = user?.role === UserRole.ADMIN;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      duration: 0,
      price: 0,
      type: ServiceType.TIME_BASED, // Add default for type
      maxCapacity: 1, // Add default for maxCapacity
      categoryId: "",
      branchId: "",
      staffIds: [],
      isActive: true,
    },
  });

  // Fetch service data
  const { data: service, isLoading: isServiceLoading } = useQuery({
    queryKey: ["service", id],
    queryFn: async () => {
      const response = await api.get(`/services/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    },
    enabled: !!id && !!token,
  });

  // Fetch related data (categories, staff, branches)
  const { data: apiData, isLoading: isApiDataLoading } = useQuery<ApiData>({
    queryKey: ["service-edit-data"],
    queryFn: async () => {
      const [categoriesRes, staffRes, branchesRes] = await Promise.all([
        api.get("/service-categories", { headers: { Authorization: `Bearer ${token}` } }),
        api.get("/staff", { headers: { Authorization: `Bearer ${token}` } }),
        api.get("/branches", { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      return {
        categories: categoriesRes.data,
        staff: staffRes.data,
        branches: branchesRes.data,
      };
    },
    enabled: !!token,
  });

  // Populate form when both service and api data are available
  useEffect(() => {
    if (service && apiData) {
      const staffIds = service.staff ? service.staff.map((s: any) => s.userId) : [];
      form.reset({
        name: service.name,
        duration: service.duration,
        price: service.price,
        type: service.type, // Ensure type is passed
        maxCapacity: service.maxCapacity, // Ensure maxCapacity is passed
        categoryId: service.categoryId,
        branchId: service.branchId,
        staffIds: staffIds,
        isActive: service.isActive,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [service, apiData]);

  // Filter staff based on selected branch
  const watchedBranchId = form.watch("branchId");
  const filteredStaff = useMemo(() => {
    if (!apiData?.staff) return [];
    if (!watchedBranchId) {
        if (canSelectBranch) return [];
        return apiData.staff;
    }
    return apiData.staff.filter((s) => s.branchId === watchedBranchId);
  }, [apiData?.staff, watchedBranchId, canSelectBranch]);

  // Form submission handler
  const handleSubmit = async (data: FormValues) => {
    try {
      await api.patch(`/services/${id}`, data, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Hizmet başarıyla güncellendi");
      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: ["services"] });
      queryClient.invalidateQueries({ queryKey: ["service", id] });
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
        <ArrowLeft className="mr-2 h-4 w-4" /> Geri
      </Button>
      <Card>
        <CardHeader><CardTitle>Hizmeti Düzenle</CardTitle></CardHeader>
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
                      <FormControl><Input placeholder="Örn: Saç Kesimi" {...field} /></FormControl>
                      <FormMessage />
                      </FormItem>
                      )}
                      />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              </div>
                
                <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kategori</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ''} key={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Kategori seçin" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {apiData?.categories?.map((category) => (
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

                <FormField control={form.control} name="duration" render={({ field }) => (<FormItem><FormLabel>Süre (dakika)</FormLabel><FormControl><Input type="number" {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="price" render={({ field }) => (<FormItem><FormLabel>Fiyat (TL)</FormLabel><FormControl><Input type="number" {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>)} />

                {canSelectBranch && (
                  <FormField
                    control={form.control}
                    name="branchId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Şube</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ''} key={field.value}>
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
                      <FormLabel>Personel</FormLabel>
                      <FormControl>
                        <MultiSelect
                          options={filteredStaff.map(s => ({ value: s.id, label: s.name }))}
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
