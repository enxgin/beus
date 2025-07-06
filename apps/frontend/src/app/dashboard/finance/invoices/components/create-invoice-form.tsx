"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import api from "@/lib/api";
import { useAuthStore } from "@/stores/auth.store";

const createInvoiceSchema = z.object({
  invoiceType: z.enum(["package", "service"]),
  customerId: z.string().min(1, "Müşteri seçimi zorunludur"),
  packageId: z.string().optional(),
  appointmentId: z.string().optional(),
  discountRate: z.coerce.number().min(0).max(100).default(0),
});

type CreateInvoiceFormValues = z.infer<typeof createInvoiceSchema>;

// Backend DTO'ya uygun olarak dönüştürülecek veri tipi
type CreateInvoiceFromServiceDto = {
  invoiceType: "package" | "service";
  customerId: string;
  packageId?: string;
  appointmentId?: string;
  discountRate: number;
};

interface CreateInvoiceFormProps {
  onSuccess: () => void;
}

export function CreateInvoiceForm({ onSuccess }: CreateInvoiceFormProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"package" | "service">("package");
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [selectedPackage, setSelectedPackage] = useState<any>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);

  const form = useForm<CreateInvoiceFormValues>({
    resolver: zodResolver(createInvoiceSchema) as any,
    defaultValues: {
      invoiceType: "package",
      discountRate: 0,
    },
  });

  const { data: customers = [] } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const response = await api.get("/customers");
      return response.data;
    },
  });

  const { data: packages = [] } = useQuery({
    queryKey: ["packages"],
    queryFn: async () => {
      const response = await api.get("/packages");
      return response.data;
    },
  });

  const { data: appointments = [] } = useQuery({
    queryKey: ["appointments", "completed", selectedCustomer?.id],
    queryFn: async () => {
      if (!selectedCustomer?.id) return [];
      const response = await api.get("/appointments", {
        params: {
          customerId: selectedCustomer.id,
          status: "COMPLETED",
          invoiceStatus: "UNPAID",
        },
      });
      return response.data;
    },
    enabled: !!selectedCustomer?.id && activeTab === "service",
  });

  const { token } = useAuthStore();

  const createInvoiceMutation = useMutation({
    mutationFn: async (data: CreateInvoiceFromServiceDto) => {
      return api.post("/invoices/from-service", data, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
    },
    onSuccess: () => {
      toast({
        title: "Fatura oluşturuldu",
        description: "Fatura başarıyla oluşturuldu.",
      });
      onSuccess();
    },
    onError: (error) => {
      console.error("Fatura oluşturma hatası:", error);
      toast({
        title: "Hata",
        description: "Fatura oluşturulurken bir hata oluştu.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CreateInvoiceFormValues) => {
    // Validate form based on active tab
    if (activeTab === "package" && !data.packageId) {
      toast({
        title: "Hata",
        description: "Paket seçimi zorunludur",
        variant: "destructive",
      });
      return;
    }

    if (activeTab === "service" && !data.appointmentId) {
      toast({
        title: "Hata",
        description: "Randevu seçimi zorunludur",
        variant: "destructive",
      });
      return;
    }

    // Form verilerini backend DTO'ya dönüştür
    const invoiceData: CreateInvoiceFromServiceDto = {
      invoiceType: data.invoiceType,
      customerId: data.customerId,
      discountRate: data.discountRate || 0
    };

    // Seçilen tipe göre ilgili ID'yi ekle
    if (data.invoiceType === "package" && data.packageId) {
      invoiceData.packageId = data.packageId;
    } else if (data.invoiceType === "service" && data.appointmentId) {
      invoiceData.appointmentId = data.appointmentId;
    }

    createInvoiceMutation.mutate(invoiceData);
  };

  // Müşteri değiştiğinde ilgili bilgileri güncelle
  const handleCustomerChange = (customerId: string) => {
    const customer = customers.find((c: any) => c.id === customerId);
    setSelectedCustomer(customer);
    
    // Müşterinin indirim oranını forma yansıt
    if (customer?.discountRate) {
      form.setValue("discountRate", customer.discountRate);
    } else {
      form.setValue("discountRate", 0);
    }
  };

  // Paket değiştiğinde ilgili bilgileri güncelle
  const handlePackageChange = (packageId: string) => {
    const pkg = packages.find((p: any) => p.id === packageId);
    setSelectedPackage(pkg);
  };

  // Randevu değiştiğinde ilgili bilgileri güncelle
  const handleAppointmentChange = (appointmentId: string) => {
    const appointment = appointments.find((a: any) => a.id === appointmentId);
    setSelectedAppointment(appointment);
  };

  // Tab değiştiğinde form değerlerini sıfırla
  const handleTabChange = (value: string) => {
    setActiveTab(value as "package" | "service");
    form.setValue("packageId", undefined);
    form.setValue("appointmentId", undefined);
    setSelectedPackage(null);
    setSelectedAppointment(null);
  };

  const handleSubmit = form.handleSubmit((data: CreateInvoiceFormValues) => onSubmit(data));
  
  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <FormField
          control={form.control}
          name="customerId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Müşteri</FormLabel>
              <Select
                onValueChange={(value) => {
                  field.onChange(value);
                  handleCustomerChange(value);
                }}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Müşteri seçin" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {customers.map((customer: any) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {selectedCustomer && (
          <div className="bg-muted/30 p-3 rounded-md">
            <h4 className="font-medium mb-2">Müşteri Bilgileri</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">İsim:</span> {selectedCustomer.name}
              </div>
              <div>
                <span className="text-muted-foreground">Telefon:</span> {selectedCustomer.phone}
              </div>
              {selectedCustomer.discountRate > 0 && (
                <div className="col-span-2">
                  <span className="text-muted-foreground">İndirim Oranı:</span>{" "}
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    %{selectedCustomer.discountRate}
                  </Badge>
                </div>
              )}
            </div>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="package">Paket Satışı</TabsTrigger>
            <TabsTrigger value="service">Hizmet Faturası</TabsTrigger>
          </TabsList>
          
          <TabsContent value="package" className="space-y-4 pt-4">
            <FormField
              control={form.control}
              name="packageId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Paket</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      handlePackageChange(value);
                    }}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Paket seçin" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {packages.map((pkg: any) => (
                        <SelectItem key={pkg.id} value={pkg.id}>
                          {pkg.name} - {formatCurrency(pkg.price)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedPackage && (
              <Card>
                <CardContent className="pt-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Paket Adı:</span>
                      <span className="font-medium">{selectedPackage.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Geçerlilik:</span>
                      <span>{selectedPackage.validityDays} gün</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Fiyat:</span>
                      <span className="font-medium">{formatCurrency(selectedPackage.price)}</span>
                    </div>
                    
                    <Separator />
                    
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">İndirim Oranı:</span>
                      <span>%{form.watch("discountRate")}</span>
                    </div>
                    
                    <div className="flex justify-between font-bold">
                      <span>Toplam Tutar:</span>
                      <span>
                        {formatCurrency(
                          selectedPackage.price * (1 - form.watch("discountRate") / 100)
                        )}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="service" className="space-y-4 pt-4">
            <FormField
              control={form.control}
              name="appointmentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tamamlanan Randevu</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      handleAppointmentChange(value);
                    }}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Randevu seçin" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {appointments.length === 0 ? (
                        <SelectItem value="none" disabled>
                          Faturalandırılacak tamamlanmış randevu bulunamadı
                        </SelectItem>
                      ) : (
                        appointments.map((appointment: any) => (
                          <SelectItem key={appointment.id} value={appointment.id}>
                            {new Date(appointment.startTime).toLocaleDateString("tr-TR")} - {appointment.service.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedAppointment && (
              <Card>
                <CardContent className="pt-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Hizmet:</span>
                      <span className="font-medium">{selectedAppointment.service.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tarih:</span>
                      <span>{new Date(selectedAppointment.startTime).toLocaleDateString("tr-TR")}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Personel:</span>
                      <span>{selectedAppointment.staff.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Fiyat:</span>
                      <span className="font-medium">{formatCurrency(selectedAppointment.service.price)}</span>
                    </div>
                    
                    <Separator />
                    
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">İndirim Oranı:</span>
                      <span>%{form.watch("discountRate")}</span>
                    </div>
                    
                    <div className="flex justify-between font-bold">
                      <span>Toplam Tutar:</span>
                      <span>
                        {formatCurrency(
                          selectedAppointment.service.price * (1 - form.watch("discountRate") / 100)
                        )}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        <FormField
          control={form.control}
          name="discountRate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>İndirim Oranı (%)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Müşteriye özel indirim oranı (0-100 arası)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2">
          <Button variant="outline" type="button" onClick={() => onSuccess()}>
            İptal
          </Button>
          <Button 
            type="submit" 
            disabled={
              createInvoiceMutation.isPending || 
              !form.formState.isValid || 
              (activeTab === "package" && !selectedPackage) || 
              (activeTab === "service" && !selectedAppointment)
            }
          >
            {createInvoiceMutation.isPending ? "Oluşturuluyor..." : "Fatura Oluştur"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
