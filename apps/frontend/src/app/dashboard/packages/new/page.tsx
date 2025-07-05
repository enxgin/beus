"use client";

import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, SubmitHandler } from "react-hook-form";
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
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
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
import api from "@/lib/api";
import { useAuthStore } from "@/stores/auth.store";
import { UserRole } from "@/types/user";
import { PackageType } from "@/types/package";
import { ArrowLeft, HomeIcon } from "lucide-react";

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
  validityDays: z.coerce.number().min(1, {
    message: "Geçerlilik süresi en az 1 gün olmalıdır.",
  }),
  type: z.enum([PackageType.SESSION, PackageType.TIME], {
    required_error: "Paket türü seçimi zorunludur.",
  }),
  totalSessions: z.coerce
    .number()
    .min(1, {
      message: "Seans sayısı en az 1 olmalıdır.",
    })
    .optional(),
  totalMinutes: z.coerce
    .number()
    .min(1, {
      message: "Toplam dakika en az 1 olmalıdır.",
    })
    .optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface Branch {
  id: string;
  name: string;
}

interface Service {
  id: string;
  name: string;
  price: number;
}

export default function NewPackagePage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuthStore();
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [manualServices, setManualServices] = useState<Service[]>([]);
  const [manualServicesLoading, setManualServicesLoading] = useState(false);

  // Form başlangıç değerleri için şube ID'yi kullanıcı rolüne göre belirle
  const isRoleWithFixedBranch = user?.role === UserRole.BRANCH_MANAGER || 
                               user?.role === UserRole.RECEPTION || 
                               user?.role === UserRole.STAFF ||
                               user?.role === UserRole.BRANCH_ADMIN;
  
  const initialBranchId = isRoleWithFixedBranch && user?.branchId ? user.branchId : "";
  console.log("Başlangıç şube ID'si:", initialBranchId, "Rol:", user?.role);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      branchId: initialBranchId,
      price: 0,
      validityDays: 365, // Varsayılan olarak 1 yıl
      type: PackageType.SESSION,
      totalSessions: 1,
      totalMinutes: 60,
    },
  });

  const { data: branches, isLoading: branchesLoading } = useQuery<Branch[]>({
    queryKey: ["branches"],
    queryFn: () => api.get("/branches").then((res) => res.data),
    enabled: user?.role === UserRole.SUPER_ADMIN,
  });

  const selectedBranchId = form.watch("branchId");

  const { data: services, isLoading: servicesLoading } = useQuery<Service[]>({
    queryKey: ["services", selectedBranchId],
    queryFn: () =>
      api.get(`/services?branchId=${selectedBranchId}`).then((res) => res.data),
    enabled: !!selectedBranchId,
  });

  const createPackageMutation = useMutation({
    mutationFn: (newPackage: any) => api.post("/packages", newPackage),
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "Paket başarıyla oluşturuldu.",
      });
      router.push("/dashboard/packages");
    },
    onError: (error: any) => {
      console.error("Paket oluşturma hatası:", error);
      toast({
        variant: "destructive",
        title: "Hata",
        description:
          error.response?.data?.message || "Paket oluşturulurken bir hata oluştu.",
      });
    },
  });

  useEffect(() => {
    const fetchServices = async () => {
      const branchId = form.getValues('branchId');
      console.log("Şube ID değeri:", branchId);
      
      if (branchId) {
        setManualServicesLoading(true);
        setManualServices([]); // Önceki hizmetleri temizle
        setSelectedServiceIds([]); // Seçili hizmetleri de temizle
        try {
          console.log(`API isteği yapılıyor: /services?branchId=${branchId}&take=1000`);
          const token = useAuthStore.getState().token;
          console.log("Token var mı:", !!token);
          const response = await api.get(`/services?branchId=${branchId}&take=1000`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          console.log("API yanıtı alındı:", response.data);
          
          // Gelen verinin paginated yapıya uygun olup olmadığını kontrol et
          if (response.data && Array.isArray(response.data.data)) {
            console.log(`${response.data.data.length} adet hizmet bulundu`);
            setManualServices(response.data.data);
          } else {
            console.warn("Hizmetler API'sinden beklenen format gelmedi:", response.data);
            setManualServices([]);
          }
        } catch (error) {
          console.error("Hizmetler getirilirken hata oluştu:", error);
          toast({
            variant: "destructive",
            title: "Hata",
            description: "Hizmetler getirilirken bir hata oluştu.",
          });
          setManualServices([]);
        } finally {
          setManualServicesLoading(false);
        }
      } else {
        console.log("Şube seçilmediği için hizmetler listelenemedi.");
        // Şube seçilmediyse hizmet listesini boşalt
        setManualServices([]);
        setSelectedServiceIds([]);
      }
    };

    fetchServices();
  }, [form.watch('branchId'), toast]);

  const onSubmit: SubmitHandler<FormValues> = (data) => {
    // Backend'in beklediği services formatını oluştur
    const services = selectedServiceIds.map(serviceId => ({
      serviceId,
      quantity: data.type === PackageType.SESSION ? Number(data.totalSessions) || 1 : 1
    }));
    
    // Tüm sayısal değerleri Number tipine çevirelim
    const payload = {
      name: data.name,
      description: data.description || "",
      branchId: data.branchId,
      price: Number(data.price),
      validityDays: Number(data.validityDays),
      type: data.type,
      services: services // Backend'in beklediği services array formatı
    };

    // Paket tipine göre totalSessions veya totalMinutes ekleyelim
    if (data.type === PackageType.SESSION) {
      payload.totalSessions = Number(data.totalSessions);
      // totalMinutes alanını göndermeyelim
    } else if (data.type === PackageType.TIME) {
      payload.totalMinutes = Number(data.totalMinutes);
      // totalSessions alanını göndermeyelim
    }

    console.log("Gönderilen paket verisi:", payload);
    createPackageMutation.mutate(payload);
  };

  return (
    <div className="space-y-6">
      <div>
        <Breadcrumb>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard">
              <HomeIcon className="h-4 w-4 mr-1" />
              Ana Sayfa
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard/packages">Paketler</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem isCurrentPage>
            <BreadcrumbLink>Yeni Paket</BreadcrumbLink>
          </BreadcrumbItem>
        </Breadcrumb>
        <div className="flex justify-between items-center mt-2">
          <h1 className="text-3xl font-bold tracking-tight">Yeni Paket Oluştur</h1>
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Geri Dön
          </Button>
        </div>
        <p className="text-muted-foreground mt-1">
          Yeni bir paket oluşturun ve sisteme hizmetler ekleyin.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Paket Bilgileri</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Paket Adı</FormLabel>
                        <FormControl>
                          <Input placeholder="Örn: 10 Seanslık Pilates Paketi" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Açıklama</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Paket hakkında detaylı bilgi" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {user?.role === UserRole.SUPER_ADMIN && (
                    <FormField
                      control={form.control}
                      name="branchId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Şube</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Bir şube seçin" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {branchesLoading ? (
                                <SelectItem value="loading" disabled>Yükleniyor...</SelectItem>
                              ) : (
                                branches?.map((branch) => (
                                  <SelectItem key={branch.id} value={branch.id}>
                                    {branch.name}
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fiyat (TL)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="Örn: 1500" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="validityDays"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Geçerlilik Süresi (Gün)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="Örn: 365" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>Paket Türü</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex flex-col space-y-1"
                          >
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value={PackageType.SESSION} />
                              </FormControl>
                              <FormLabel className="font-normal">Seans Bazlı</FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value={PackageType.TIME} />
                              </FormControl>
                              <FormLabel className="font-normal">Süre Bazlı</FormLabel>
                            </FormItem>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {form.watch("type") === PackageType.SESSION && (
                    <FormField
                      control={form.control}
                      name="totalSessions"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Toplam Seans</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="Örn: 10" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  {form.watch("type") === PackageType.TIME && (
                    <FormField
                      control={form.control}
                      name="totalMinutes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Toplam Dakika</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="Örn: 600" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Hizmetler</h3>
                {manualServicesLoading ? (
                  <p>Hizmetler yükleniyor...</p>
                ) : manualServices && manualServices.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {manualServices.map((service) => (
                      <div key={service.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={service.id}
                          checked={selectedServiceIds.includes(service.id)}
                          onCheckedChange={(checked) => {
                            return checked
                              ? setSelectedServiceIds([...selectedServiceIds, service.id])
                              : setSelectedServiceIds(
                                  selectedServiceIds.filter((id) => id !== service.id)
                                );
                          }}
                        />
                        <label
                          htmlFor={service.id}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {service.name}
                        </label>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>Bu şubeye ait hizmet bulunamadı veya şube seçilmedi.</p>
                )}
              </div>

              <div className="flex justify-end">
                <Button
                  type="button"
                  onClick={async () => {
                    try {
                      // Önce form doğrulamasını çalıştır
                      const formValid = await form.trigger();
                      if (!formValid) {
                        toast({
                          variant: "destructive",
                          title: "Form Hatası",
                          description: "Lütfen form alanlarını kontrol ediniz."
                        });
                        return;
                      }
                      
                      const data = form.getValues();
                      let hasError = false;

                      if (user?.role === UserRole.SUPER_ADMIN && !data.branchId) {
                        toast({
                          variant: "destructive",
                          title: "Hata",
                          description: "Şube seçimi zorunludur"
                        });
                        hasError = true;
                      }
                      
                      // Hizmet seçimi kontrolü
                      if (selectedServiceIds.length === 0) {
                        toast({
                          variant: "destructive",
                          title: "Hata",
                          description: "En az bir hizmet seçilmelidir"
                        });
                        hasError = true;
                      }
                      
                      // Seans sayısı kontrolü
                      if (data.type === PackageType.SESSION && (!data.totalSessions || Number(data.totalSessions) <= 0)) {
                        toast({
                          variant: "destructive",
                          title: "Hata",
                          description: "Geçerli bir seans sayısı belirtilmelidir"
                        });
                        hasError = true;
                      }
                      
                      // Dakika kontrolü
                      if (data.type === PackageType.TIME && (!data.totalMinutes || Number(data.totalMinutes) <= 0)) {
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
                      toast({
                        variant: "destructive",
                        title: "Hata",
                        description: "Beklenmeyen bir hata oluştu: " + (error instanceof Error ? error.message : String(error))
                      });
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
