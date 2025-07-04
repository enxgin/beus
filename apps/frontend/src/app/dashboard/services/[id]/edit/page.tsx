"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MultiSelect } from "@/components/ui/multi-select";
import { useAuthStore } from "@/stores/auth.store";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

const formSchema = z.object({
  name: z.string().min(2, {
    message: 'Hizmet adı en az 2 karakter olmalıdır.',
  }),
  duration: z.coerce.number().min(5, {
    message: 'Süre en az 5 dakika olmalıdır.',
  }),
  price: z.coerce.number().min(0, {
    message: 'Fiyat 0 veya daha büyük olmalıdır.',
  }),
  categoryId: z.string().min(1, { message: 'Kategori seçimi zorunludur.' }),
  branchId: z.string(), // Şube ID'si zorunlu olmaktan çıkarıldı ama hala form değerinde tutulacak
  staffIds: z.array(z.string()).min(1, { message: 'En az bir personel seçilmelidir.' }),
  isActive: z.boolean().optional(),
});

const EditServicePage = () => {
  const router = useRouter();
  const { id } = useParams();
  const { user } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formValues, setFormValues] = useState({
    name: "",
    duration: 30,
    price: 0,
    categoryId: "",
    branchId: "",
    staffIds: [] as string[],
    isActive: true,
  });

  // Form verileri için API çağrısı
  const { data: formData, isLoading: isFormDataLoading } = useQuery({
    queryKey: ["service-form-data"],
    queryFn: async () => {
      try {
        const [categoriesRes, branchesRes, staffRes] = await Promise.all([
          api.get("/service-categories"),
          api.get("/branches"),
          api.get("/users?role=STAFF"),
        ]);

        return {
          categories: categoriesRes.data,
          branches: branchesRes.data,
          staff: staffRes.data.data || staffRes.data,
        };
      } catch (error) {
        console.error("Form verileri yüklenirken hata:", error);
        throw error;
      }
    },
  });

  // Hizmet verisi için API çağrısı
  const { data: service, isLoading: isServiceLoading } = useQuery({
    queryKey: ["service", id],
    queryFn: async () => {
      try {
        const response = await api.get(`/services/${id}`);
        console.log("API'dan dönen hizmet:", response.data);
        return response.data;
      } catch (error) {
        console.error("Hizmet verileri alınırken hata:", error);
        throw error;
      }
    },
    enabled: !!id,
  });

  // Verilerin yüklendiğinde form state'i güncelle
  // Form verilerinin ve servis verilerinin yüklenmesini bekle
  useEffect(() => {
    if (service && formData) {
      console.log("Hizmet detayları:", service);
      
      // Kategori ID'si alma
      let categoryId = "";
      if (service.category && typeof service.category === 'object') {
        categoryId = service.category.id;
      } else if (service.categoryId) {
        categoryId = service.categoryId;
      }
      
      // Şube ID'si alma
      let branchId = "";
      if (service.branch && typeof service.branch === 'object') {
        branchId = service.branch.id;
      } else if (service.branchId) {
        branchId = service.branchId;
      }
      
      // Personel ID'leri alma
      let staffIds: string[] = [];
      if (service.staff && Array.isArray(service.staff)) {
        staffIds = service.staff.map((s: any) => {
          if (typeof s === 'object' && s.id) return s.id;
          return s;
        }).filter(Boolean);
      } else if (service.staffIds && Array.isArray(service.staffIds)) {
        staffIds = service.staffIds;
      }
      
      console.log("Bulunan değerler:", { categoryId, branchId, staffIds });
      
      // Verilerin varlığını kontrol et ve değerleri set et
      setTimeout(() => {
        setFormValues({
          name: service.name || "",
          duration: service.duration || 30,
          price: service.price || 0,
          categoryId,
          branchId,
          staffIds,
          isActive: service.isActive !== false,
        });
        
        console.log("Form değerleri ayarlandı:", {
          name: service.name || "",
          duration: service.duration || 30,
          price: service.price || 0,
          categoryId,
          branchId,
          staffIds,
          isActive: service.isActive !== false,
        });
      }, 100);
    }
  }, [service, formData]);

  // Şubeye göre filtrelenmiş personel listesi
  const filteredStaff = formData?.staff?.filter((s: any) => {
    if (!formValues.branchId) return false;
    
    // Personelin şubesini farklı veri yapılarında kontrol et
    if (s.branch && typeof s.branch === 'object' && s.branch.id === formValues.branchId) return true;
    if (typeof s.branch === 'string' && s.branch === formValues.branchId) return true;
    if (s.branchId && s.branchId === formValues.branchId) return true;
    
    return false;
  }) || [];

  // Form handler'ları
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    if (type === 'number') {
      setFormValues((prev) => ({
        ...prev,
        [name]: value === '' ? '' : Number(value),
      }));
    } else {
      setFormValues((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormValues((prev) => ({
      ...prev,
      [name]: value,
      // Şube değiştiğinde personel seçimini sıfırla
      ...(name === 'branchId' ? { staffIds: [] } : {}),
    }));
  };

  const handleStaffChange = (selectedStaff: string[]) => {
    setFormValues((prev) => ({
      ...prev,
      staffIds: selectedStaff,
    }));
  };

  const handleCheckboxChange = (checked: boolean) => {
    setFormValues((prev) => ({
      ...prev,
      isActive: checked,
    }));
  };

  // Form gönderme
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Form validasyonu
    try {
      formSchema.parse(formValues);
    } catch (error) {
      console.error("Form validasyon hatası:", error);
      toast.error("Lütfen tüm alanları doğru şekilde doldurun.");
      return;
    }
    
    // API çağrısı ile hizmeti güncelle
    setIsSubmitting(true);
    api.patch(`/services/${id}`, {
      name: formValues.name,
      duration: Number(formValues.duration) || 30,
      price: Number(formValues.price) || 0,
      categoryId: formValues.categoryId,
      branchId: formValues.branchId,
      staffIds: formValues.staffIds,
      isActive: formValues.isActive,
    })
    .then((response) => {
      toast.success("Hizmet başarıyla güncellendi");
      router.push(`/dashboard/services/${id}`);
    })
    .catch((error) => {
      console.error("Hizmet güncellenirken hata:", error);
      toast.error(error.response?.data?.message || "Hizmet güncellenirken bir hata oluştu");
    })
    .finally(() => {
      setIsSubmitting(false);
    });
  };

  // Yükleme durumunu kontrol et
  const isLoading = isServiceLoading || isFormDataLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // API'den veri gelmezse hata göster
  if (!service || !formData) {
    return (
      <div className="container mx-auto py-10">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Hizmet verileri yüklenemedi</h1>
          <Button variant="outline" onClick={() => router.push(`/dashboard/services`)} className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Hizmetlere Dön
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <div className="mb-6">
        <Button variant="outline" onClick={() => router.push(`/dashboard/services/${id}`)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Hizmet Detayına Dön
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Hizmet Düzenle</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Hizmet Adı
                </label>
                <Input 
                  id="name" 
                  name="name" 
                  placeholder="Hizmet adını giriniz" 
                  value={formValues.name}
                  onChange={handleInputChange}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="categoryId" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Kategori
                </label>
                <Select 
                  value={formValues.categoryId || undefined} 
                  onValueChange={(value) => handleSelectChange("categoryId", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Kategori seçiniz" />
                  </SelectTrigger>
                  <SelectContent>
                    {formData?.categories?.map((category: any) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label htmlFor="duration" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Süre (dakika)
                </label>
                <Input 
                  id="duration" 
                  name="duration" 
                  type="number" 
                  min="5"
                  placeholder="Süre giriniz" 
                  value={formValues.duration}
                  onChange={handleInputChange}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="price" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Fiyat (₺)
                </label>
                <Input 
                  id="price" 
                  name="price" 
                  type="number"
                  min="0" 
                  step="0.01"
                  placeholder="Fiyat giriniz" 
                  value={formValues.price}
                  onChange={handleInputChange}
                />
              </div>



              <div className="space-y-2">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Bu Hizmeti Verebilecek Personeller
                  <span className="block text-xs text-muted-foreground mt-1">
                    Şubeye ait personeller listelenmektedir
                  </span>
                </label>
                <MultiSelect
                  options={filteredStaff.map((s: any) => ({ 
                    label: s.name, 
                    value: s.id 
                  }))}
                  selected={formValues.staffIds || []}
                  onChange={handleStaffChange}
                  placeholder="Birden fazla personel seçebilirsiniz"
                  emptyIndicator={formValues.branchId ? "Bu şubede personel bulunamadı" : "Lütfen önce bir şube seçiniz"}
                />
              </div>

              <div className="flex items-center space-x-2 pt-4">
                <Checkbox 
                  id="isActive" 
                  checked={formValues.isActive} 
                  onCheckedChange={handleCheckboxChange}
                />
                <label htmlFor="isActive" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">
                  Hizmet Aktif
                </label>
              </div>
            </div>

            <div className="flex justify-end">
              <Button 
                variant="outline" 
                type="button" 
                onClick={() => router.push(`/dashboard/services/${id}`)}
                className="mr-2"
              >
                İptal
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Kaydediliyor...
                  </>
                ) : (
                  "Güncelle"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default EditServicePage;
