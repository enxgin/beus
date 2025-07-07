"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMutation, useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { ServiceCategory, Branch } from "@/types/service";
import { User, UserRole } from "@/types/user";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MultiSelect } from "@/components/ui/multi-select";
import { useAuthStore } from "@/stores/auth.store";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useState } from "react";

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
  branchId: z.string().min(1, { message: 'Şube seçimi zorunludur.' }),
  staffIds: z.array(z.string()).min(1, { message: 'En az bir personel seçilmelidir.' }),
  isActive: z.boolean(),
});

type ServiceFormValues = z.infer<typeof formSchema>;

const fetchFormData = async () => {
  try {
    const [categories, branches, staffResult] = await Promise.all([
      api.get("/service-categories").then(res => res.data),
      api.get("/branches").then(res => res.data),
      api.get("/users?role=STAFF").then(res => res.data),
    ]);
    
    // API might return a paginated response { items: [...] }, so we extract the array.
    let rawStaff = Array.isArray(staffResult) ? staffResult : staffResult.data || staffResult.items || [];
    
    // API verilerini normalize et
    const staff = rawStaff.map((user: any) => {
      // API'den gelen verilerde branch farklı formatlarda olabilir
      
      // 1. Eğer branch bir string ise (ID olarak gelmiş)
      if (typeof user.branch === 'string') {
        const branchInfo = branches.find((b: any) => b.id === user.branch);
        if (branchInfo) {
          return {
            ...user,
            branch: {
              id: branchInfo.id,
              name: branchInfo.name
            }
          };
        }
      } 
      // 2. Eğer branchId varsa ama branch nesnesi yoksa
      else if (user.branchId && !user.branch) {
        const branchInfo = branches.find((b: any) => b.id === user.branchId);
        if (branchInfo) {
          return {
            ...user,
            branch: {
              id: branchInfo.id,
              name: branchInfo.name
            }
          };
        }
      }
      
      // 3. Zaten doğru formatta veya branch yoksa
      return user;
    });
    
    console.log('Normalized Staff Data:', staff);
    console.log('Available Branches:', branches);
    
    return { categories, branches, staff };
  } catch (error) {
    console.error('Error fetching form data:', error);
    return { categories: [], branches: [], staff: [] };
  }
};

const CreateServicePage = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuthStore();
  
  // Form state
  const [formValues, setFormValues] = useState({
    name: "",
    duration: 30,
    price: 100,
    type: "STANDARD", // Varsayılan hizmet türü
    maxCapacity: 1, // Varsayılan kapasite
    categoryId: "",
    branchId: (user?.role === UserRole.BRANCH_MANAGER && user.branch?.id) ? user.branch.id : "",
    staffIds: [] as string[],
    isActive: true,
  });

  // Form data loading
  const { data: formData, isLoading: isFormDataLoading } = useQuery({
    queryKey: ["service-form-data"],
    queryFn: fetchFormData,
  });
  
  // MEVCUT ID'leri backend'in tanıdığı şekilde gönderelim
  const preprocessFormForSubmit = (formValues: any) => {
    // Form verilerini yeni bir objeye kopyala
    const serviceData = {
      name: formValues.name,
      duration: Number(formValues.duration) || 30,
      price: Number(formValues.price) || 0,
      type: formValues.type || 'STANDARD', // Hizmet türü
      maxCapacity: Number(formValues.maxCapacity) || 1, // Kapasite
      categoryId: String(formValues.categoryId), // ID'yi string olarak gönder
      branchId: String(formValues.branchId), // ID'yi string olarak gönder
      staffIds: formValues.staffIds.map((id: any) => String(id)), // ID array'ini string'lere dönüştür
      isActive: Boolean(formValues.isActive),
    };
    
    // Gerekli alanların boş olmadığından emin ol
    if (!serviceData.categoryId || !serviceData.branchId || !serviceData.staffIds.length || !serviceData.type) {
      throw new Error("Gerekli alanlar eksik");
    }
    
    // Kapasitenin en az 1 olduğundan emin ol
    if (serviceData.maxCapacity < 1) {
      throw new Error("Kapasite en az 1 olmalıdır");
    }
    
    return serviceData;
  };

  const mutation = useMutation({
    mutationFn: async (formData: any) => {
      try {
        // Form verilerini düzenleme
        console.log("Gönderilecek form değerleri:", formData);
        
        // Backend tarafından beklenen aşağıdaki DTO'ya uygun veri gönderiyoruz
        // class CreateServiceDto {
        //   name: string;        // String
        //   duration: number;    // Sayısal
        //   price: number;       // Sayısal
        //   categoryId: string;  // UUID olması gerekiyor
        //   branchId: string;    // UUID olması gerekiyor
        //   staffIds: string[];  // UUID dizisi olması gerekiyor
        //   isActive?: boolean;  // Opsiyonel
        // }
        
        // API isteği yap
        const response = await api.post("/services", formData);
        return response.data;
      } catch (error) {
        console.error("API Hatası:", error);
        throw error;
      }
    },
    onSuccess: () => {
      toast.success("Hizmet başarıyla oluşturuldu!");
      router.push("/dashboard/services");
    },
    onError: (error: any) => {
      toast.error(`Hizmet oluşturulamadı: ${error.response?.data?.message || error.message}`);
    },
  });

  // Handlers
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    
    // Sayısal değerler için güvenli şekilde dönüştür
    let processedValue = value;
    if (type === "number") {
      // Boş veya geçersiz değerleri NaN yerine 0 veya varsayılan değere dönüştür
      processedValue = value === "" ? "0" : value;
    }
    
    setFormValues(prev => ({
      ...prev,
      [name]: type === "number" ? processedValue : value,
    }));
  };
  
  const handleSelectChange = (name: string) => (value: string) => {
    // Boş değer kontrolü
    if (!value || value.trim() === "") {
      console.error(`Boş ${name} değeri`);
      toast.error(`Lütfen geçerli bir ${name === "branchId" ? "şube" : "kategori"} seçin`);
      return;
    }
    
    console.log(`${name} seçildi:`, value);
    
    setFormValues(prev => ({
      ...prev,
      [name]: value,
      // Şube değiştiğinde personel seçimini sıfırla
      ...(name === "branchId" ? { staffIds: [] } : {}),
    }));
  };
  
  const handleStaffChange = (selectedIds: string[]) => {
    setFormValues(prev => ({
      ...prev,
      staffIds: selectedIds,
    }));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form veriler:", formValues);

    // Boş alan kontrolü
    if (!formValues.name) {
      toast.error("Lütfen hizmet adını girin");
      return;
    }

    if (!formValues.categoryId) {
      toast.error("Lütfen bir kategori seçin");
      return;
    }

    if (!formValues.branchId) {
      toast.error("Lütfen bir şube seçin");
      return;
    }

    if (!formValues.staffIds || formValues.staffIds.length === 0) {
      toast.error("Lütfen en az bir personel seçin");
      toast.error("En az bir personel seçmelisiniz!");
      return;
    }
    
    // Form verilerini backend'e uygun formata dönüştür
    // Backend tarafında UUID beklendiği için, gerçek UUID'ler oluşturup göndermemiz gerekiyor
    const generateUUID = () => {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    };
    
    const serviceData = {
      name: formValues.name,
      duration: Number(formValues.duration) || 30,
      price: Number(formValues.price) || 0,
      categoryId: generateUUID(),  // Geçerli UUID oluştur
      branchId: generateUUID(),    // Geçerli UUID oluştur 
      staffIds: [generateUUID()],  // En az bir geçerli UUID içeren dizi
      isActive: formValues.isActive !== false  // undefined değilse true, aksi halde false
    };
    
    // Gerçek kategori, şube ve personel referanslarını ek alanlar olarak ekle
    // Bunlar veritabanına kaydedilmeyecek ama backend'de kontrol edilebilir
    const extraData = {
      _originalCategoryId: String(formValues.categoryId),
      _originalBranchId: String(formValues.branchId),
      _originalStaffIds: formValues.staffIds.map(id => String(id))
    };
    
    // Doğru endpoint'e doğrudan API çağrısı yapalım
    try {
      setIsLoading(true);
      api.post("/services", {
        name: formValues.name,
        duration: Number(formValues.duration) || 30,
        price: Number(formValues.price) || 0,
        categoryId: formValues.categoryId,
        branchId: formValues.branchId,
        staffIds: formValues.staffIds,
        isActive: formValues.isActive !== false
      })
      .then((response) => {
        console.log("Hizmet oluşturma başarılı:", response.data);
        toast.success("Hizmet başarıyla oluşturuldu!");
        router.push("/dashboard/services");
      })
      .catch((error) => {
        console.error("Hizmet oluşturma hatası:", error);
        if (error.response?.data?.message) {
          toast.error(`Hizmet oluşturulamadı: ${error.response.data.message}`);
        } else {
          toast.error("Hizmet oluşturulamadı. Sistem yöneticisine başvurun.");
        }
      })
      .finally(() => {
        setIsLoading(false);
      });
    } catch (error) {
      console.error("API çağrısında hata:", error);
      toast.error("Beklenmeyen bir hata oluştu.");
      setIsLoading(false);
    }
  };

  // Filtered staff based on selected branch
  const filteredStaff = formData?.staff?.filter((s: any) => {
    // Debug her bir personelin branch bilgisini göster
    console.log(`Personel: ${s.name}, Branch:`, s.branch, `Seçilen Branch ID: ${formValues.branchId}`);
    
    // Personelin branch bilgisi farklı formatlarda olabilir
    if (!formValues.branchId) return false;
    
    // 1. Branch bir nesne ise ve id'si seçilen şubeyle eşleşiyorsa
    if (s.branch && typeof s.branch === 'object' && s.branch.id === formValues.branchId) {
      return true;
    }
    
    // 2. Branch bir string ise (ID olarak) ve seçilen şubeyle eşleşiyorsa
    if (typeof s.branch === 'string' && s.branch === formValues.branchId) {
      return true;
    }
    
    // 3. branchId alanı varsa ve seçilen şubeyle eşleşiyorsa
    if (s.branchId && s.branchId === formValues.branchId) {
      return true;
    }
    
    // Eşleşme yoksa
    return false;
  }) || [];
  const showBranchSelect = user?.role === UserRole.ADMIN || user?.role === UserRole.SUPER_BRANCH_MANAGER;
  
  if (isFormDataLoading) return <div>Yükleniyor...</div>;

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Yeni Hizmet Oluştur</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Hizmet Adı */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Hizmet Adı*</label>
              <Input 
                name="name" 
                value={formValues.name}
                onChange={handleInputChange} 
                placeholder="Örn: Saç Kesimi"
              />
            </div>
            
            {/* Şube */}
            {showBranchSelect && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Şube*</label>
                <Select 
                  value={formValues.branchId}
                  onValueChange={handleSelectChange("branchId")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Şube seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {formData?.branches?.map((branch: Branch) => (
                      <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            {/* Kategori */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Kategori*</label>
              <Select 
                value={formValues.categoryId}
                onValueChange={handleSelectChange("categoryId")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Kategori seçin" />
                </SelectTrigger>
                <SelectContent>
                  {formData?.categories?.map((category: ServiceCategory) => (
                    <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Bu Hizmeti Verebilecek Personeller */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Bu Hizmeti Verebilecek Personeller*</label>
              {formValues.branchId ? (
                filteredStaff.length > 0 ? (
                  <MultiSelect
                    options={filteredStaff.map((s: User) => ({ value: s.id, label: s.name }))}
                    selected={formValues.staffIds}
                    onChange={handleStaffChange}
                    placeholder="Personel seçin (birden fazla seçilebilir)"
                    className="w-full"
                  />
                ) : (
                  <div className="text-sm text-muted-foreground p-2 border rounded-md">Bu şubede henüz personel bulunmuyor</div>
                )
              ) : (
                <div className="text-sm text-muted-foreground p-2 border rounded-md">Önce bir şube seçin</div>
              )}
            </div>
            
            {/* Süre */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Süre (dakika)*</label>
              <Input 
                type="number" 
                name="duration"
                value={formValues.duration}
                onChange={handleInputChange}
              />
            </div>
            
            {/* Fiyat */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Fiyat (₺)*</label>
              <Input 
                type="number" 
                name="price"
                value={formValues.price}
                onChange={handleInputChange}
              />
            </div>
            

            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Oluşturuluyor..." : "Hizmeti Oluştur"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateServicePage;
