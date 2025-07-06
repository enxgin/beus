"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { getPackage, updatePackage, getServices } from "../../api";
import { Button } from "../../../../../components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../../../../../components/ui/form";
import { Input } from "../../../../../components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../../../../../components/ui/card";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator } from "../../../../../components/ui/breadcrumb";
import { HomeIcon, ArrowLeftIcon, Save } from "lucide-react";
import { Textarea } from "../../../../../components/ui/textarea";
import { Skeleton } from "../../../../../components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../../../components/ui/select";
import { toast } from "sonner";
import { useAuth } from "../../../../../hooks/use-auth";
import { Checkbox } from "../../../../../components/ui/checkbox";
import { Badge } from "../../../../../components/ui/badge";
import { AlertCircle } from "lucide-react";

// Paket tipleri için enum
enum PackageType {
  SESSION = "SESSION",
  TIME = "TIME",
}

const packageSchema = z.object({
  name: z.string().min(2, { message: "Paket adı en az 2 karakter olmalıdır." }),
  price: z.coerce.number().positive({ message: "Fiyat sıfırdan büyük olmalıdır." }),
  validityDays: z.coerce.number().int().min(1, { message: "Geçerlilik günü en az 1 olmalıdır." }),
  description: z.string().optional(),
  branchId: z.string().optional(),
  type: z.enum(["SESSION", "TIME"], { 
    required_error: "Paket tipi seçilmelidir.",
    invalid_type_error: "Geçersiz paket tipi.",
  }),
  commissionRate: z.coerce.number().min(0).max(100).optional().nullable(),
  commissionFixed: z.coerce.number().min(0).optional().nullable(),
  totalSessions: z.coerce.number().int().min(0).optional().nullable(),
  totalMinutes: z.coerce.number().int().min(0).optional().nullable(),
});

type FormValues = z.infer<typeof packageSchema>;

interface Service {
  id: string;
  name: string;
  price: number;
  duration: number;
  description?: string;
}

const EditPackagePage = () => {
  const router = useRouter();
  const params = useParams();
  const { id } = params;
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [packageName, setPackageName] = useState("");
  const [error, setError] = useState("");
  const [services, setServices] = useState<Service[]>([]);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [servicesLoading, setServicesLoading] = useState(false);
  const { user } = useAuth();

  const form = useForm<FormValues>({
    resolver: zodResolver(packageSchema),
    defaultValues: {
      name: "",
      price: 0,
      validityDays: 365,
      description: "",
      branchId: "",
      type: "SESSION",
      commissionRate: null,
      commissionFixed: null,
      totalSessions: null,
      totalMinutes: null,
    },
  });

  // Şube ID'sini kullanıcı rolüne göre ayarla
  useEffect(() => {
    if (user) {
      // ADMIN ve SUPER_BRANCH_MANAGER için şube seçilebilir olmalı
      if (user.role === 'ADMIN' || user.role === 'SUPER_BRANCH_MANAGER') {
        // Şube ID'si form'da boş bırakılabilir, kullanıcı seçecek
      } else if (user.branch?.id) {
        // Diğer roller için kullanıcının şubesi otomatik seçilir
        form.setValue('branchId', user.branch.id);
      }
    }
  }, [user, form]);

  // Paket verilerini ve hizmetleri yükle
  useEffect(() => {
    if (typeof id === "string") {
      const fetchPackageData = async () => {
        try {
          const data = await getPackage(id);
          form.reset(data);
          setPackageName(data.name);
          
          // Seçili hizmetleri ayarla
          if (data.services && Array.isArray(data.services)) {
            const serviceIds = data.services
              .map(service => service.serviceId || service.id)
              .filter((id): id is string => id !== undefined);
            setSelectedServiceIds(serviceIds);
          }
          
          // Şube ID'sini ayarla
          if (data.branchId) {
            form.setValue('branchId', data.branchId);
            // Şubeye ait hizmetleri yükle
            fetchServices(data.branchId);
          } else if (user?.branch?.id) {
            // Kullanıcının şubesine ait hizmetleri yükle
            fetchServices(user.branch.id);
          }
        } catch (error) {
          toast.error("Paket bilgileri yüklenirken bir hata oluştu.");
          console.error(error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchPackageData();
    }
  }, [id, form, user]);
  
  // Hizmetleri getir
  const fetchServices = async (branchId: string) => {
    setServicesLoading(true);
    try {
      const response = await getServices(branchId);
      if (response && response.data) {
        setServices(response.data);
      }
    } catch (error) {
      console.error("Hizmetler yüklenirken hata:", error);
      toast.error("Hizmetler yüklenirken bir hata oluştu.");
    } finally {
      setServicesLoading(false);
    }
  };
  
  // Şube değiştiğinde hizmetleri güncelle
  const handleBranchChange = (branchId: string) => {
    if (branchId) {
      fetchServices(branchId);
    } else {
      setServices([]);
    }
  };

  const onSubmit = async (data: FormValues) => {
    // Form doğrulamasını tetikle
    const isValid = await form.trigger();
    if (!isValid) {
      toast.error("Lütfen form alanlarını kontrol edin.");
      return;
    }
    
    // SUPER_ADMIN için şube ID kontrolü
    if (user?.role === 'ADMIN' && !data.branchId) {
      toast.error("Lütfen bir şube seçin.");
      return;
    }
    
    // En az bir hizmet seçilmiş olmalı
    if (selectedServiceIds.length === 0) {
      toast.error("En az bir hizmet seçmelisiniz.");
      return;
    }
    
    // Paket tipine göre seans veya dakika kontrolü
    if (data.type === PackageType.SESSION && (!data.totalSessions || Number(data.totalSessions) <= 0)) {
      toast.error("Seans bazlı paketler için toplam seans sayısı girilmelidir.");
      return;
    } else if (data.type === PackageType.TIME && (!data.totalMinutes || Number(data.totalMinutes) <= 0)) {
      toast.error("Süre bazlı paketler için toplam dakika girilmelidir.");
      return;
    }
    
    // Backend'in beklediği services formatını oluştur
    const services = selectedServiceIds.map(serviceId => ({
      serviceId,
      quantity: data.type === PackageType.SESSION ? Number(data.totalSessions) || 1 : 1
    }));
    
    // Paket tipine göre farklı payload oluştur
    const basePayload = {
      name: data.name,
      description: data.description || "", // Boş string olarak gönder
      branchId: data.branchId,
      price: Number(data.price),
      validityDays: Number(data.validityDays),
      type: data.type,
      services: services // Backend'in beklediği services array formatı
    };

    // Paket tipine göre totalSessions veya totalMinutes ekleyelim
    let payload;
    if (data.type === PackageType.SESSION) {
      payload = {
        ...basePayload,
        totalSessions: Number(data.totalSessions)
      };
    } else {
      payload = {
        ...basePayload,
        totalMinutes: Number(data.totalMinutes)
      };
    }

    setIsSaving(true);
    try {
      if (typeof id === "string") {
        console.log("Gönderilen paket verisi:", payload);
        await updatePackage(id, payload);
        toast.success("Paket başarıyla güncellendi!");
        router.push("/dashboard/packages");
      }
    } catch (error) {
      toast.error("Paket güncellenirken bir hata oluştu.");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  if (error) {
    return (
      <div className="space-y-6">
        <Breadcrumb>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard">
              <HomeIcon className="h-4 w-4 mr-1" />
              Ana Sayfa
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard/packages">Paketler</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbItem isCurrentPage>
            <BreadcrumbLink>Hata</BreadcrumbLink>
          </BreadcrumbItem>
        </Breadcrumb>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-destructive">Hata Oluştu</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
          </CardContent>
          <CardFooter>
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeftIcon className="mr-2 h-4 w-4" />
              Geri Dön
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {isLoading ? (
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="h-4 w-1/3" />
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-24 w-full" />
              <div className="flex justify-end">
                <Skeleton className="h-10 w-24" />
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <Breadcrumb>
                  <BreadcrumbItem>
                    <BreadcrumbLink href="/dashboard">
                      <HomeIcon className="h-4 w-4" />
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbLink href="/dashboard/packages">Paketler</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem isCurrentPage>
                    <BreadcrumbLink>
                      {packageName ? `Paketi Düzenle: ${packageName}` : "Paketi Düzenle"}
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                </Breadcrumb>
                <CardTitle className="text-2xl font-bold tracking-tight mt-2">
                  {packageName ? `Paketi Düzenle: ${packageName}` : "Paketi Düzenle"}
                </CardTitle>
                <CardDescription className="mt-1">
                  Paket bilgilerini güncelleyin.
                </CardDescription>
              </div>
              <Button variant="outline" size="icon" onClick={() => router.back()}>
                <ArrowLeftIcon className="h-4 w-4" />
              </Button>
            </div>
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
                        <FormLabel>Paket Adı</FormLabel>
                        <FormControl>
                          <Input placeholder="Örn: 10 Seanslık Pilates" {...field} />
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
                          <Input type="number" placeholder="0.00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                {/* Şube seçimi - sadece ADMIN ve SUPER_BRANCH_MANAGER için */}
                {(user?.role === 'ADMIN' || user?.role === 'SUPER_BRANCH_MANAGER') && (
                  <FormField
                    control={form.control}
                    name="branchId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Şube</FormLabel>
                        <Select
                          onValueChange={(value) => {
                            field.onChange(value);
                            handleBranchChange(value);
                          }}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Şube seçin" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {user?.branch ? (
                              <SelectItem key={user.branch.id} value={user.branch.id}>
                                {user.branch.name}
                              </SelectItem>
                            ) : (
                              <SelectItem value="">Şube seçin</SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="validityDays"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Geçerlilik Süresi (Gün)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="365" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Paket Tipi</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Bir tip seçin" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="SESSION">Seans Bazlı</SelectItem>
                            <SelectItem value="TIME">Süre Bazlı</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="totalSessions"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Toplam Seans</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Seans sayısı"
                            {...field}
                            value={field.value === null ? "" : field.value}
                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                          />
                        </FormControl>
                        <FormDescription>
                          Paket tipi 'Seans Bazlı' ise doldurun
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="totalMinutes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Toplam Süre (Dakika)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Toplam dakika"
                            {...field}
                            value={field.value === null ? "" : field.value}
                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                          />
                        </FormControl>
                        <FormDescription>
                          Paket tipi 'Süre Bazlı' ise doldurun
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="commissionRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Komisyon Oranı (%)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="0-100 arası"
                            {...field}
                            value={field.value === null ? "" : field.value}
                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                          />
                        </FormControl>
                        <FormDescription>
                          İsteğe bağlıdır, boş bırakabilirsiniz
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="commissionFixed"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sabit Komisyon (TL)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Sabit komisyon tutarı"
                            {...field}
                            value={field.value === null ? "" : field.value}
                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                          />
                        </FormControl>
                        <FormDescription>
                          İsteğe bağlıdır, boş bırakabilirsiniz
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                {/* Hizmet seçimi */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium">Hizmetler</h3>
                    <p className="text-sm text-muted-foreground">
                      Pakete dahil edilecek hizmetleri seçin
                    </p>
                  </div>
                  
                  {servicesLoading ? (
                    <div className="space-y-2">
                      <Skeleton className="h-8 w-full" />
                      <Skeleton className="h-8 w-full" />
                      <Skeleton className="h-8 w-full" />
                    </div>
                  ) : services.length === 0 ? (
                    <div className="rounded-md bg-muted p-4 text-sm">
                      {form.getValues('branchId') ? 
                        "Bu şubede henüz hizmet tanımlanmamış." : 
                        "Lütfen önce bir şube seçin."}
                    </div>
                  ) : (
                    <div className="h-72 rounded-md border p-4 overflow-y-auto">
                      <div className="space-y-4">
                        {services.map((service) => (
                          <div key={service.id} className="flex items-start space-x-3 rounded-md p-2 hover:bg-muted">
                            <Checkbox
                              id={`service-${service.id}`}
                              checked={selectedServiceIds.includes(service.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedServiceIds([...selectedServiceIds, service.id]);
                                } else {
                                  setSelectedServiceIds(selectedServiceIds.filter(id => id !== service.id));
                                }
                              }}
                            />
                            <div className="grid gap-1">
                              <label
                                htmlFor={`service-${service.id}`}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                              >
                                {service.name}
                              </label>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">{service.duration} dk</Badge>
                                <Badge variant="secondary">{new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(service.price)}</Badge>
                              </div>
                              {service.description && (
                                <p className="text-xs text-muted-foreground">{service.description}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {selectedServiceIds.length > 0 && (
                    <p className="text-sm text-muted-foreground">
                      {selectedServiceIds.length} hizmet seçildi
                    </p>
                  )}
                </div>
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Açıklama</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Paket hakkında açıklama"
                          className="resize-none"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormDescription>
                        İsteğe bağlıdır, boş bırakabilirsiniz
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex justify-end">
                  <Button type="submit" disabled={isSaving}>
                    {isSaving ? (
                      <>Kaydediliyor...</>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Değişiklikleri Kaydet
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EditPackagePage;
