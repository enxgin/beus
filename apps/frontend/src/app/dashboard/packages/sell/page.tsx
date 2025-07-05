"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { toast } from "sonner";
import { useDebounce } from "use-debounce";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

// UI Components
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Search, 
  CalendarIcon, 
  HomeIcon, 
  Package, 
  User, 
  Loader2, 
  Check, 
  CheckCircle, 
  Filter,
  Phone,
  CreditCard,
  Clock,
  Calendar as CalendarIcon2,
  Mail,
  Building
} from "lucide-react";

// Hooks and API
import { useAuthStore } from "@/stores/auth.store";
import { createCustomerPackage, getPackagesByBranch } from "../api";
import { searchCustomers } from "../../customers/api";

// Types
import type { 
  Package as PackageType, 
  Customer as CustomerType, 
  PackageService as PackageServiceType 
} from "@/types";

// Form schema
const formSchema = z.object({
  customerId: z.string({
    required_error: "Lütfen bir müşteri seçin",
  }),
  packageId: z.string({
    required_error: "Lütfen bir paket seçin",
  }),
  startDate: z.date({
    required_error: "Lütfen bir satış tarihi seçin",
  }),
  salesCode: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

// SelectionCard bileşeni - paket kartı için
const SelectionCard = ({ 
  pkg,
  isSelected,
  onClick,
}: { 
  pkg: PackageType; 
  isSelected: boolean;
  onClick: () => void; 
}) => {
  return (
    <Card
      onClick={onClick}
      className={`cursor-pointer transition-all duration-300 hover:border-primary overflow-hidden ${isSelected ? "border-2 border-primary" : "border border-muted"}`}
    >
      <CardHeader className="p-4 pb-2">
        <CardTitle className="flex items-center text-base">
          <Package className="w-5 h-5 mr-2" />
          <span className="line-clamp-1">{pkg.name}</span>
          {isSelected && <CheckCircle className="ml-auto w-5 h-5 text-primary" />}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="flex justify-between items-center mb-2">
          <Badge variant="outline" className="bg-muted">
            {pkg.type === "SESSION" ? `${pkg.totalSessions} Seans` : `${pkg.totalMinutes} Dakika`}
          </Badge>
          <Badge variant="secondary">
            {pkg.validityDays} Gün
          </Badge>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <CreditCard className="w-4 h-4 mr-1 text-muted-foreground" />
            <span className="text-base font-semibold">
              {pkg.price.toLocaleString("tr-TR")} ₺
            </span>
          </div>
        </div>
      </CardContent>
      {pkg.services && pkg.services.length > 0 && (
        <CardFooter className="p-4 pt-0 flex flex-col items-start">
          <Separator className="my-2" />
          <div className="text-xs text-muted-foreground">
            <span className="font-medium">İçerdiği Hizmetler:</span>
            <div className="mt-1 space-y-1">
              {pkg.services.map((ps: PackageServiceType) => (
                <div key={ps.id || ps.serviceId} className="flex items-center">
                  <Check className="w-3 h-3 mr-1" />
                  <span>
                    {ps.service?.name} ({ps.quantity}x)
                  </span>
                </div>
              ))}
            </div>
          </div>
        </CardFooter>
      )}
    </Card>
  );
};

// CustomerTableRow bileşeni - müşteri tablosundaki satırlar için
const CustomerTableRow = ({
  customer,
  isSelected,
  onSelect,
}: {
  customer: CustomerType;
  isSelected: boolean;
  onSelect: () => void;
}) => {
  return (
    <TableRow 
      onClick={onSelect} 
      className={`cursor-pointer hover:bg-muted ${isSelected ? "bg-muted" : ""}`}
    >
      <TableCell>
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">
            {customer.firstName} {customer.lastName}
          </span>
          {isSelected && (
            <Badge variant="outline" className="ml-2 bg-primary/10 text-primary border-primary/20">
              <Check className="mr-1 h-3 w-3" /> Seçildi
            </Badge>
          )}
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          <Phone className="h-3.5 w-3.5 text-muted-foreground" />
          <span>{customer.phone || "-"}</span>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          <Mail className="h-3.5 w-3.5 text-muted-foreground" />
          <span>{customer.email || "-"}</span>
        </div>
      </TableCell>
    </TableRow>
  );
};

// Ana sayfa bileşeni
export default function SellPackagePage() {
  const router = useRouter();
  const { user, token } = useAuthStore(); // Standardize edilmiş token kullanımı
  
  // State tanımlamaları
  const [currentTab, setCurrentTab] = useState("customer");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery] = useDebounce(searchQuery, 300);
  const [searchResults, setSearchResults] = useState<CustomerType[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerType | null>(null);
  const [packages, setPackages] = useState<PackageType[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<PackageType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form tanımı
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customerId: "",
      packageId: "",
      startDate: new Date(),
      salesCode: `SLS-${Math.floor(Math.random() * 1000000).toString().padStart(6, "0")}`,
      notes: "",
    },
  });
  
  // Form değerleri ve durumu
  const formValues = form.watch();
  const { isValid, isDirty } = form.formState;
  
  // Müşteri arama işlevi
  useEffect(() => {
    const fetchCustomers = async () => {
      if (!debouncedSearchQuery || debouncedSearchQuery.length < 2) {
        setSearchResults([]);
        return;
      }
      
      setIsLoading(true);
      try {
        const branchId = user?.branch?.id;
        console.log("Müşteri arama isteği gönderiliyor:", { search: debouncedSearchQuery, branchId });
        const result = await searchCustomers(debouncedSearchQuery, branchId || undefined);
        console.log("Müşteri arama sonuçları:", result);
        setSearchResults(result);
      } catch (error) {
        console.error("Müşteri arama hatası:", error);
        toast.error("Müşteriler yüklenirken bir hata oluştu.");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCustomers();
  }, [debouncedSearchQuery, token, user?.branch?.id]);
  
  // Paketleri yükleme işlevi
  useEffect(() => {
    const fetchPackages = async () => {
      setIsLoading(true);
      try {
        const branchId = user?.branch?.id;
        console.log("Paket yükleme isteği gönderiliyor:", { branchId });
        const result = await getPackagesByBranch(branchId || "");
        console.log("Paket yükleme sonuçları:", result);
        setPackages(result);
      } catch (error) {
        console.error("Paket yükleme hatası:", error);
        toast.error("Paketler yüklenirken bir hata oluştu.");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPackages();
  }, [token, user?.branch?.id]);
  
  // Form gönderimi
  const onSubmit = async (values: FormValues) => {
    console.log("Form gönderiliyor:", values);
    setIsSubmitting(true);
    
    try {
      if (!selectedCustomer || !selectedPackage) {
        toast.error("Lütfen önce bir müşteri ve paket seçin.");
        setIsSubmitting(false);
        return;
      }

      const submissionData = {
        ...values,
        customerId: selectedCustomer.id,
        packageId: selectedPackage.id,
        startDate: values.startDate.toISOString(), // Tarihi ISO string formatına çevir
      };

      await createCustomerPackage(submissionData);
      toast.success("Paket satışı başarıyla oluşturuldu.");
      router.push("/dashboard/packages");
    } catch (error) {
      console.error("Form gönderimi hatası:", error);
      toast.error("Paket satışı oluşturulurken bir hata oluştu.");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Müşteri seçimi
  const handleCustomerSelect = (customer: CustomerType) => {
    console.log("Müşteri seçildi:", customer);
    setSelectedCustomer(customer);
    form.setValue("customerId", customer.id, { shouldValidate: true });
    setCurrentTab("package");
  };
  
  // Paket seçimi
  const handlePackageSelect = (pkg: PackageType) => {
    console.log("Paket seçildi:", pkg);
    setSelectedPackage(pkg);
    form.setValue("packageId", pkg.id, { shouldValidate: true });
    setCurrentTab("details");
  };

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
            <BreadcrumbLink href="/dashboard/packages">Paketler</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem isCurrentPage>
            <BreadcrumbLink>Paket Satışı</BreadcrumbLink>
          </BreadcrumbItem>
        </Breadcrumb>
        <h1 className="text-3xl font-bold tracking-tight mt-2">Paket Satışı</h1>
        <p className="text-muted-foreground mt-1">
          Müşterilerinize yeni paketler satın ve satış sürecini yönetin.
        </p>
      </div>

      {/* Adımlar çizgisi */}
      <Tabs 
        value={currentTab} 
        onValueChange={(value) => {
          // Önceki adımlar tamamlanmadan sonraki adıma geçilemesin
          if (value === "package" && !selectedCustomer) return;
          if (value === "details" && (!selectedCustomer || !selectedPackage)) return;
          
          setCurrentTab(value);
        }}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="customer" disabled={isSubmitting}>
            <div className="flex items-center">
              <User className="h-4 w-4 mr-2" />
              <span>Müşteri Seçimi</span>
              {selectedCustomer && <Check className="h-4 w-4 ml-2 text-green-500" />}
            </div>
          </TabsTrigger>
          <TabsTrigger value="package" disabled={!selectedCustomer || isSubmitting}>
            <div className="flex items-center">
              <Package className="h-4 w-4 mr-2" />
              <span>Paket Seçimi</span>
              {selectedPackage && <Check className="h-4 w-4 ml-2 text-green-500" />}
            </div>
          </TabsTrigger>
          <TabsTrigger value="details" disabled={!selectedCustomer || !selectedPackage || isSubmitting}>
            <div className="flex items-center">
              <CreditCard className="h-4 w-4 mr-2" />
              <span>Satış Detayları</span>
            </div>
          </TabsTrigger>
        </TabsList>
        
        {/* Müşteri Seçimi */}
        <TabsContent value="customer" className="p-0 border-0">
          <Card>
            <CardHeader>
              <CardTitle>Müşteri Seçimi</CardTitle>
              <CardDescription>Paket satışı yapacağınız müşteriyi seçin</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Müşteri adı ile arayın..."
                      className="pl-8"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline">Yeni Müşteri</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Yeni Müşteri Ekle</DialogTitle>
                        <DialogDescription>
                          Bu özellik henüz geliştirme aşamasındadır.
                        </DialogDescription>
                      </DialogHeader>
                    </DialogContent>
                  </Dialog>
                </div>
                
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : debouncedSearchQuery && debouncedSearchQuery.length >= 2 ? (
                  searchResults.length > 0 ? (
                    <div>
                      <div className="text-sm text-muted-foreground mb-2">
                        {searchResults.length} müşteri bulundu
                      </div>
                      <div className="border rounded-md overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Müşteri</TableHead>
                              <TableHead>Telefon</TableHead>
                              <TableHead>E-posta</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {searchResults.map((customer) => (
                              <CustomerTableRow
                                key={customer.id}
                                customer={customer}
                                isSelected={selectedCustomer?.id === customer.id}
                                onSelect={() => handleCustomerSelect(customer)}
                              />
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      Aradığınız kriterlere uygun müşteri bulunamadı
                    </div>
                  )
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Arama yapmak için en az 2 karakter girin
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t p-4 bg-muted/50">
              <div className="flex items-center gap-2">
                {selectedCustomer && (
                  <Badge className="bg-primary/10 text-primary border-primary/20">
                    Seçili Müşteri: {selectedCustomer.firstName} {selectedCustomer.lastName}
                  </Badge>
                )}
              </div>
              <Button 
                onClick={() => selectedCustomer && setCurrentTab("package")} 
                disabled={!selectedCustomer}
              >
                Devam Et
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Paket Seçimi */}
        <TabsContent value="package" className="p-0 border-0">
          <Card>
            <CardHeader>
              <CardTitle>Paket Seçimi</CardTitle>
              <CardDescription>
                {selectedCustomer ? `${selectedCustomer.firstName} ${selectedCustomer.lastName} için paket seçin` : ""}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : packages.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {packages.map((pkg) => (
                      <SelectionCard
                        key={pkg.id}
                        pkg={pkg}
                        isSelected={selectedPackage?.id === pkg.id}
                        onClick={() => handlePackageSelect(pkg)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Kullanılabilir paket bulunamadı
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t p-4 bg-muted/50">
              <Button variant="ghost" onClick={() => setCurrentTab("customer")}>
                Geri Dön
              </Button>
              <div className="flex items-center gap-2">
                {selectedPackage && (
                  <Badge className="bg-primary/10 text-primary border-primary/20">
                    Seçili Paket: {selectedPackage.name} - {selectedPackage.price.toLocaleString("tr-TR")} ₺
                  </Badge>
                )}
              </div>
              <Button 
                onClick={() => selectedPackage && setCurrentTab("details")} 
                disabled={!selectedPackage}
              >
                Devam Et
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Satış Detayları */}
        <TabsContent value="details" className="p-0 border-0">
          <Card>
            <CardHeader>
              <CardTitle>Satış Detayları</CardTitle>
              <CardDescription>
                Lütfen satış bilgilerini doldurun ve işlemi tamamlayın
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {selectedCustomer && selectedPackage && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Seçilen müşteri ve paket bilgileri */}
                      <Card className="border border-muted bg-muted/30 overflow-hidden">
                        <CardHeader className="bg-muted/50 pb-2">
                          <CardTitle className="text-base flex items-center">
                            <User className="w-4 h-4 mr-2" />
                            Müşteri Bilgileri
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 text-sm">
                          <div className="space-y-1">
                            <div className="font-medium">{selectedCustomer.firstName} {selectedCustomer.lastName}</div>
                            {selectedCustomer.phone && (
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Phone className="h-3 w-3" /> {selectedCustomer.phone}
                              </div>
                            )}
                            {selectedCustomer.email && (
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Mail className="h-3 w-3" /> {selectedCustomer.email}
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card className="border border-muted bg-muted/30 overflow-hidden">
                        <CardHeader className="bg-muted/50 pb-2">
                          <CardTitle className="text-base flex items-center">
                            <Package className="w-4 h-4 mr-2" />
                            Paket Bilgileri
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 text-sm">
                          <div className="space-y-2">
                            <div>
                              <div className="font-medium">{selectedPackage.name}</div>
                              <div className="text-muted-foreground text-xs">{selectedPackage.description}</div>
                            </div>
                            <div className="flex items-center gap-2">
                              <CreditCard className="h-3 w-3 text-muted-foreground" />
                              <span className="font-medium">{selectedPackage.price.toLocaleString("tr-TR")} ₺</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="h-3 w-3 text-muted-foreground" />
                              <span>{selectedPackage.validityDays} gün geçerlilik</span>
                            </div>
                            <div>
                              <span className="text-xs text-muted-foreground">Hizmetler:</span>
                              {selectedPackage.services && selectedPackage.services.length > 0 && (
                                <div className="space-y-1 mt-1 text-xs">
                                  {selectedPackage.services.map((ps) => (
                                    <div key={ps.id || ps.serviceId}>
                                      • {ps.service?.name} ({ps.quantity}x)
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                  
                  {/* Form alanları */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="startDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Başlangıç Tarihi</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className="w-full pl-3 text-left font-normal"
                                >
                                  {field.value ? (
                                    format(field.value, "d MMMM yyyy", { locale: tr })
                                  ) : (
                                    <span>Tarih seçin</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormDescription>
                            Paketin geçerli olacağı başlangıç tarihi
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="salesCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Satış Kodu</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormDescription>
                            Otomatik oluşturulur, ihtiyaç halinde değiştirebilirsiniz
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notlar</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Bu satış hakkında eklemek istediğiniz notlar"
                            className="resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          İsterseniz satış hakkında özel notlar ekleyebilirsiniz
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <input type="hidden" {...form.register("customerId")} />
                  <input type="hidden" {...form.register("packageId")} />
                </form>
              </Form>
            </CardContent>
            <CardFooter className="flex justify-between border-t p-4 bg-muted/50">
              <Button variant="ghost" onClick={() => setCurrentTab("package")}>
                Geri Dön
              </Button>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => router.push("/dashboard/packages")}>
                  İptal
                </Button>
                <Button 
                  onClick={form.handleSubmit(onSubmit)} 
                  disabled={isSubmitting || !isValid}
                >
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Satışı Tamamla
                </Button>
              </div>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}