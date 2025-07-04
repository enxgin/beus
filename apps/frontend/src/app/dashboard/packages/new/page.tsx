"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, SubmitHandler, UseFormReturn } from "react-hook-form";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/use-toast";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth.store";
import { UserRole } from "@/types/user";
import { PackageType } from "@/types/package";
import { ArrowLeft } from "lucide-react";

// Form şeması
const formSchema = z.object({
  name: z.string().min(2, {
    message: "Paket adı en az 2 karakter olmalıdır.",
  }),
  description: z.string().optional(),
  branchId: z.string().min(1, {
    message: "Şube seçimi zorunludur.",
  }),
  price: z.coerce.number().min(0, {
    message: "Fiyat 0 veya daha büyük olmalıdır.",
  }),
  type: z.enum([PackageType.SESSION, PackageType.TIME], {
    required_error: "Paket türü seçimi zorunludur.",
  }),
  totalSessions: z.coerce
    .number()
    .min(1, {
      message: "Seans sayısı en az 1 olmalıdır.",
    })
    .optional()
    .refine((val) => val === undefined || val >= 1, {
      message: "Seans sayısı en az 1 olmalıdır.",
    }),
  totalMinutes: z.coerce
    .number()
    .min(1, {
      message: "Toplam dakika en az 1 olmalıdır.",
    })
    .optional()
    .refine((val) => val === undefined || val >= 1, {
      message: "Toplam dakika en az 1 olmalıdır.",
    }),
  validityDays: z.coerce.number().min(1, {
    message: "Geçerlilik süresi en az 1 gün olmalıdır.",
  }),
  isActive: z.boolean().default(true),
  serviceIds: z.array(z.string()).min(1, {
    message: "En az bir hizmet seçilmelidir.",
  }),
});

type FormValues = z.infer<typeof formSchema>;

// Yardımcı fonksiyon - kullanıcı rolüne göre varsayılan şubeyi belirler
const getBranchDefault = (user: any): string => {
  if (!user) return "";
  
  if (user.role === UserRole.ADMIN || user.role === "SUPER_BRANCH_ADMIN") {
    return "";
  } else if (user.branch?.id) {
    return user.branch.id;
  }
  return "";
};

// Service türü tanımları
interface Service {
  id: string;
  name: string;
  description?: string;
  price: number;
  duration?: number;
  categoryId?: string;
  category?: {
    id: string;
    name: string;
  };
}

interface Branch {
  id: string;
  name: string;
}

// Form veri tipi ve query sonuç tipi
interface FormData {
  branches: Branch[];
  services: Service[];
  servicesByCategory?: Record<string, Service[]>;
}

type FormDataQueryResult = {
  data: FormData | undefined;
  isLoading: boolean;
};

const fetchFormData = async (): Promise<FormData> => {
  try {
    // Paralel istekler yap
    const [branchesResponse, servicesResponse] = await Promise.all([
      api.get("/branches"),
      api.get("/services"),
    ]);

    const branches: Branch[] = branchesResponse.data || [];
    const services: Service[] = servicesResponse.data || [];

    // Hizmetleri kategorilere göre grupla
    const servicesByCategory = services.reduce<Record<string, Service[]>>((acc, service) => {
      const categoryName = service.category?.name || "Diğer";
      if (!acc[categoryName]) {
        acc[categoryName] = [];
      }
      acc[categoryName].push(service);
      return acc;
    }, {});

    return { branches, services, servicesByCategory };
  } catch (error) {
    console.error("Veri çekme hatası:", error);
    return { branches: [], services: [], servicesByCategory: {} };
  }
};

export default function NewPackagePage() {
  const { toast } = useToast();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [packageType, setPackageType] = useState<PackageType>(PackageType.SESSION);

  // Form verilerini çek
  const { data: formData, isLoading: isFormDataLoading }: FormDataQueryResult = useQuery({ 
    queryKey: ["package-form-data"],
    queryFn: fetchFormData,
  });

  // Form tanımı
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as any, // Type uyumsuzluğu nedeniyle 'as any' kullanıyoruz
    defaultValues: {
      name: "",
      description: "",
      branchId: getBranchDefault(user),
      price: 0,
      type: PackageType.SESSION,
      totalSessions: 10,
      totalMinutes: 0,
      validityDays: 180, // 6 ay varsayılan
      isActive: true,
      serviceIds: [],
    },
  }) as UseFormReturn<FormValues>; // Form tipini kesin olarak belirtiyoruz

  // Form değerlerini izle
  const watchType = form.watch("type");

  // Paket oluşturma mutasyonu
  const createPackageMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      console.log("Mutasyon fonksiyonu başlatılıyor, gönderilen veriler:", data);
      
      try {
        // Formda seçilen hizmetleri kontrol et
        if (!Array.isArray(data.serviceIds) || data.serviceIds.length === 0) {
          throw new Error("En az bir hizmet seçilmelidir");
        }
        
        // Hizmet seçimlerini düzenle
        const selectedServices = formData?.services
          ?.filter((service) => selectedServiceIds.includes(service.id))
          ?.map((service) => ({
            serviceId: service.id,
            quantity: data.type === PackageType.SESSION ? 1 : service.duration || 60,
          })) || [];
          
        console.log("Seçilen hizmetler:", selectedServices);

        // Backend'e gönderilecek veri
        const packageData = {
          name: data.name,
          description: data.description,
          price: data.price,
          branchId: data.branchId,
          type: data.type,
          validityDays: data.validityDays,
          isActive: data.isActive,
          totalSessions: data.type === PackageType.SESSION ? data.totalSessions : undefined,
          totalMinutes: data.type === PackageType.TIME ? data.totalMinutes : undefined,
          services: selectedServices,
        };

        console.log("API'ye gönderilecek veri:", packageData);
        return await api.post("/packages", packageData);
      } catch (err) {
        console.error("Mutasyon içinde hata oluştu:", err);
        throw err; // Hata fırlat
      }
    },
    onSuccess: (data) => {
      console.log("Paket başarıyla oluşturuldu, sunucu yanıtı:", data);
      toast({
        title: "Başarılı!",
        description: "Paket başarıyla oluşturuldu.",
      });
      // Kısa bir gecikme ekleyerek yönlendirme öncesi toast gösteriminin tamamlanmasını sağla
      setTimeout(() => {
        router.push("/dashboard/packages");
      }, 1000);
    },
    onError: (error: any) => {
      console.error("Paket oluşturulurken hata:", error);
      let errorMessage = "Paket oluşturulurken bir hata oluştu.";
      
      // Hata mesajını çıkarmaya çalış
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        variant: "destructive",
        title: "Hata!",
        description: errorMessage,
      });
    },
  });

  // Seçili hizmetleri form ile senkronize et
  const updateFormServiceIds = (selectedIds: string[]) => {
    form.setValue("serviceIds", selectedIds);
  };

  // Form gönderimi
  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    try {
      console.log("Form submit edildi:", data);
      console.log("Form hataları:", form.formState.errors);
      console.log("Seçilen hizmetler:", selectedServiceIds);
      
      // Son seçilen hizmet ID'lerini form state'ine aktar
      const submissionData = { ...data, serviceIds: [...selectedServiceIds] };
      
      // Form validasyonu geçerli mi?
      if (Object.keys(form.formState.errors).length > 0) {
        console.error("Form geçerli değil:", form.formState.errors);
        toast({
          variant: "destructive",
          title: "Form Hatası!",
          description: "Lütfen form alanlarını kontrol ediniz.",
        });
        return;
      }

      if (selectedServiceIds.length === 0) {
        console.error("Hizmet seçilmedi!");
        toast({
          variant: "destructive",
          title: "Hata!",
          description: "En az bir hizmet seçilmelidir.",
        });
        return;
      }

      // Tür kontrolü
      if (data.type === PackageType.SESSION && (!data.totalSessions || data.totalSessions <= 0)) {
        console.error("Seans sayısı belirtilmedi veya geçersiz!");
        toast({
          variant: "destructive",
          title: "Hata!",
          description: "Geçerli bir seans sayısı belirtilmelidir.",
        });
        return;
      }

      if (data.type === PackageType.TIME && (!data.totalMinutes || data.totalMinutes <= 0)) {
        console.error("Toplam dakika belirtilmedi veya geçersiz!");
        toast({
          variant: "destructive",
          title: "Hata!",
          description: "Geçerli bir toplam dakika belirtilmelidir.",
        });
        return;
      }

      console.log("Mutasyon başlatılıyor...", submissionData);
      createPackageMutation.mutate(submissionData);
    } catch (error) {
      console.error("onSubmit fonksiyonunda beklenmeyen hata:", error);
      toast({
        variant: "destructive",
        title: "Beklenmeyen Hata!",
        description: "Form gönderiminde bir hata oluştu. Lütfen tekrar deneyiniz.",
      });
    }
  };

  // Hizmet seçimi işleyicisi
  const handleServiceToggle = (serviceId: string) => {
    setSelectedServiceIds((prev) => {
      const newIds = prev.includes(serviceId)
        ? prev.filter((id) => id !== serviceId)
        : [...prev, serviceId];

      // Form state güncelle
      form.setValue("serviceIds", newIds, { shouldValidate: true });
      return newIds;
    });
  };

  // Yükleniyor durumu
  if (isFormDataLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Hizmetleri kategorilerine göre render et
  const renderServicesByCategory = () => {
    if (!formData || !formData.services || formData.services.length === 0) {
      return <div>Hizmetler yükleniyor...</div>;
    }
    
    // Hizmetleri kategorilere göre grupla (eğer servicesByCategory yoksa)
    const servicesByCat = formData.servicesByCategory || formData.services.reduce<Record<string, Service[]>>((acc, service) => {
      const categoryName = service.category?.name || "Diğer";
      if (!acc[categoryName]) {
        acc[categoryName] = [];
      }
      acc[categoryName].push(service);
      return acc;
    }, {});

    return Object.entries(servicesByCat).map(([category, services]) => (
      <div key={category} className="mb-4">
        <h4 className="font-medium mb-2">{category}</h4>
        <div className="pl-2">
          {Array.isArray(services) && services.map((service) => (
              <div
                key={service.id}
                className="flex items-center space-x-2 border p-2 rounded-md"
              >
                <Checkbox
                  checked={selectedServiceIds.includes(service.id)}
                  onCheckedChange={() => handleServiceToggle(service.id)}
                />
                <span>{service.name}</span>
                <span className="text-xs text-muted-foreground ml-auto">
                  {new Intl.NumberFormat("tr-TR", {
                    style: "currency",
                    currency: "TRY",
                  }).format(service.price)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )
    );
  };

  return (
    <div className="container mx-auto py-10">
      <div className="mb-6">
        <Button variant="outline" onClick={() => router.push("/dashboard/packages")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Paketlere Dön
        </Button>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Yeni Paket</h1>
          <p className="text-muted-foreground mt-1">Yeni paket tanımı oluşturun</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Paket Bilgileri</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form 
              onSubmit={(e) => {
                e.preventDefault(); // Tarayıcının default davranışını engelle
                console.log("Form submit eventi tetiklendi");
                // Son seçilen servisleri form state'ine aktar
                updateFormServiceIds(selectedServiceIds);
                
                form.handleSubmit((data) => {
                  console.log("handleSubmit callback çalıştı", data);
                  onSubmit(data);
                })(e);
              }} 
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Sol Kolon */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-4">Temel Bilgiler</h3>

                    {/* Şube Seçimi */}
                    <FormField
                      control={form.control}
                      name="branchId"
                      render={({ field }) => (
                        <FormItem className="mb-4">
                          <FormLabel>Şube</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            disabled={user?.role === UserRole.BRANCH_MANAGER}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Şube seçiniz" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {formData?.branches.map((branch: Branch) => (
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

                    {/* Paket Adı */}
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem className="mb-4">
                          <FormLabel>Paket Adı</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Örn: 10 Seans Lazer Epilasyon"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Açıklama */}
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem className="mb-4">
                          <FormLabel>Açıklama</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Paket hakkında detaylı bilgi..."
                              className="resize-none h-24"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Paket Türü */}
                  <div>
                    <h3 className="text-lg font-medium mb-4">Paket Türü</h3>

                    <FormField
                      control={form.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem className="mb-4 space-y-3">
                          <FormLabel>Paket Türü</FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              className="flex flex-col space-y-2"
                            >
                              <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value={PackageType.SESSION} />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  Adet Bazlı (Seans sayısı)
                                </FormLabel>
                              </FormItem>
                              <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value={PackageType.TIME} />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  Dakika Bazlı (Toplam süre)
                                </FormLabel>
                              </FormItem>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Seans Sayısı (Adet bazlı) */}
                    {watchType === PackageType.SESSION && (
                      <FormField
                        control={form.control}
                        name="totalSessions"
                        render={({ field }) => (
                          <FormItem className="mb-4">
                            <FormLabel>Toplam Seans Sayısı</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min={1}
                                placeholder="Örn: 10"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    {/* Dakika (Süre bazlı) */}
                    {watchType === PackageType.TIME && (
                      <FormField
                        control={form.control}
                        name="totalMinutes"
                        render={({ field }) => (
                          <FormItem className="mb-4">
                            <FormLabel>Toplam Dakika</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min={1}
                                placeholder="Örn: 300"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                </div>

                {/* Sağ Kolon */}
                <div className="space-y-6">
                  {/* Fiyat ve Geçerlilik */}
                  <div>
                    <h3 className="text-lg font-medium mb-4">Fiyat ve Geçerlilik</h3>

                    {/* Fiyat */}
                    <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem className="mb-4">
                          <FormLabel>Fiyat (₺)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={0}
                              step="0.01"
                              placeholder="0.00"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Geçerlilik Süresi */}
                    <FormField
                      control={form.control}
                      name="validityDays"
                      render={({ field }) => (
                        <FormItem className="mb-4">
                          <FormLabel>Geçerlilik Süresi (Gün)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={1}
                              placeholder="180"
                              {...field}
                            />
                          </FormControl>
                          <p className="text-xs text-muted-foreground mt-1">
                            Satın alımdan itibaren kaç gün geçerli olacak
                          </p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Durum */}
                    <FormField
                      control={form.control}
                      name="isActive"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 mb-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Aktif</FormLabel>
                            <p className="text-xs text-muted-foreground">
                              Paketi aktif olarak kullanıma aç
                            </p>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Kapsanan Hizmetler */}
                  <div>
                    <h3 className="text-lg font-medium mb-4">Kapsanan Hizmetler</h3>
                    <div className="max-h-64 overflow-y-auto border rounded-md p-3">
                      {renderServicesByCategory()}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Bu paket hangi hizmetler için kullanılabilir?
                    </p>
                    {form.formState.errors.serviceIds && (
                      <p className="text-sm text-destructive mt-1">
                        {form.formState.errors.serviceIds.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Form Butonları */}
              <div className="flex justify-end space-x-3 mt-8 pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/dashboard/packages")}
                >
                  İptal
                </Button>
                <Button 
                  type="button"
                  onClick={() => {
                    try {
                      console.log("Submit butonu tıklandı");
                      // Son seçilen servisleri form state'ine aktar
                      form.setValue("serviceIds", [...selectedServiceIds]);
                      
                      // Tüm kontrolleri manuel yapalım
                      const data = form.getValues();
                      let hasError = false;
                      
                      // Alan kontrolleri
                      if (!data.name) {
                        toast({
                          variant: "destructive",
                          title: "Hata",
                          description: "Paket adı gereklidir"
                        });
                        hasError = true;
                      }
                      
                      if (selectedServiceIds.length === 0) {
                        toast({
                          variant: "destructive",
                          title: "Hata",
                          description: "En az bir hizmet seçilmelidir"
                        });
                        hasError = true;
                      }
                      
                      if (data.type === PackageType.SESSION && (!data.totalSessions || data.totalSessions <= 0)) {
                        toast({
                          variant: "destructive",
                          title: "Hata",
                          description: "Geçerli bir seans sayısı belirtilmelidir"
                        });
                        hasError = true;
                      }
                      
                      if (data.type === PackageType.TIME && (!data.totalMinutes || data.totalMinutes <= 0)) {
                        toast({
                          variant: "destructive",
                          title: "Hata",
                          description: "Geçerli bir dakika sayısı belirtilmelidir"
                        });
                        hasError = true;
                      }
                      
                      if (!hasError) {
                        console.log("Form kontroller geçti, gönderiliyor...", data);
                        onSubmit(data);
                      }
                    } catch (error) {
                      console.error("Buton tıklama işleminde hata:", error);
                    }
                  }}
                  disabled={createPackageMutation.isPending}
                >
                  {createPackageMutation.isPending ? (
                    <>Oluşturuluyor...</>
                  ) : (
                    <>Paketi Oluştur</>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
