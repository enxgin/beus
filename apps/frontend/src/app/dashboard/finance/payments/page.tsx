"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { FileText, Download, FilterIcon, HomeIcon } from "lucide-react";
import api from "@/lib/api";
import { PaymentList } from "./components/payment-list";
import { PaymentFlow } from "./components/payment-flow";
import { PaymentFilters, PaymentFilters as PaymentFiltersType } from "./components/payment-filters";

export default function PaymentsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("pending");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<PaymentFiltersType>({});
  
  // Fetch customers for the filter dropdown
  const { data: customers = [] } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      try {
        const response = await api.get("/customers", {
          params: {
            take: 100,
          }
        });
        return Array.isArray(response.data) ? response.data : [];
      } catch (error) {
        console.error("Müşteriler yüklenirken hata:", error);
        return [];
      }
    },
    staleTime: 5 * 60 * 1000, // 5 dakika boyunca veriyi önbellekte tutalım
  });

  // Faturalar üzerinden ödemeleri alalım - performans optimizasyonu yapıldı
  const { data: payments = [], isLoading } = useQuery({
    queryKey: ["payments", activeTab],
    queryFn: async () => {
      try {
        // Önce faturaları çekelim, sonra içlerindeki ödemeleri alalım
        let invoices = [];
        
        if (activeTab === "completed") {
          // Tamamlanmış ödemeler için SADECE tamamen ödenmiş (PAID) faturaları alalım
          // Kısmen ödenmiş faturalar (PARTIALLY_PAID) tamamlanmış sayılmaz
          
          // Sadece ödenmiş faturalar
          const paidResponse = await api.get("/invoices", {
            params: {
              take: 100,
              status: "PAID"
            }
          });
          
          // Sonuçları al
          invoices = Array.isArray(paidResponse.data) ? paidResponse.data : [];
          
        } else if (activeTab === "all") {
          // Tüm faturaları alalım
          const response = await api.get("/invoices", {
            params: {
              take: 100, // Performans için sonuç sayısını sınırlayalım
            }
          });
          invoices = Array.isArray(response.data) ? response.data : [];
        }
        
        // Faturalardan ödemeleri çıkaralım
        const allPayments = [];
        
        // Her faturanın ödemelerini işleyelim
        for (const invoice of invoices) {
          // Sadece ödemesi olan faturaları işleyelim
          if (invoice.payments && Array.isArray(invoice.payments) && invoice.payments.length > 0) {
            // Her ödemeye fatura bilgilerini ekleyelim
            // Add proper typing to the payment parameter to fix TypeScript lint warning
            const paymentsWithInvoice = invoice.payments.map((payment: { id: string; amount: number; method: string; createdAt?: string; paymentDate?: string }) => ({
              ...payment,
              invoice: {
                id: invoice.id,
                status: invoice.status,
                totalAmount: invoice.totalAmount
              },
              customer: invoice.customer
            }));
            
            allPayments.push(...paymentsWithInvoice);
          }
        }
        
        // Performans için console.log'u kaldıralım veya sadece geliştirme modunda gösterelim
        if (process.env.NODE_ENV === 'development') {
          console.log(`${allPayments.length} ödeme bulundu`);
        }
        
        return allPayments;
      } catch (error) {
        console.error("Ödemeler yüklenirken hata:", error);
        return [];
      }
    },
    enabled: activeTab !== "pending", // Pending tab'de bu sorguyu çalıştırmaya gerek yok
    staleTime: 5 * 60 * 1000, // 5 dakika boyunca veriyi önbellekte tutalım
    refetchOnWindowFocus: false, // Pencere odağı değiştiğinde yeniden sorgu yapmayalım
  });

  const { data: pendingInvoices = [], isLoading: isLoadingInvoices } = useQuery({
    queryKey: ["pendingInvoices"],
    queryFn: async () => {
      try {
        // Hem ödenmemiş hem de kısmen ödenmiş faturaları alalım
        // Backend tek seferde sadece bir status parametresi kabul ediyor
        // Bu yüzden iki ayrı istek yapalım ve sonuçları birleştirelim
        
        // 1. Ödenmemiş faturalar
        const unpaidResponse = await api.get("/invoices", { 
          params: { 
            status: "UNPAID",
            take: 100, // Performans için sonuç sayısını sınırlayalım
            orderBy: { createdAt: 'desc' } // En yeni faturaları önce gösterelim
          } 
        });
        
        // 2. Kısmen ödenmiş faturalar
        const partiallyPaidResponse = await api.get("/invoices", { 
          params: { 
            status: "PARTIALLY_PAID",
            take: 100, 
            orderBy: { createdAt: 'desc' }
          } 
        });
        
        // Sonuçları birleştir
        const unpaidInvoices = Array.isArray(unpaidResponse.data) ? unpaidResponse.data : [];
        const partiallyPaidInvoices = Array.isArray(partiallyPaidResponse.data) ? partiallyPaidResponse.data : [];
        const allInvoices = [...unpaidInvoices, ...partiallyPaidInvoices];
        
        // Performans için console.log'u kaldıralım veya sadece geliştirme modunda gösterelim
        if (process.env.NODE_ENV === 'development') {
          console.log(`${allInvoices.length} bekleyen fatura bulundu`);
        }
        
        return allInvoices;

      } catch (error) {
        console.error("Bekleyen faturalar yüklenirken hata:", error);
        return [];
      }
    },
    enabled: activeTab === "pending", // Sadece pending tab'de çalıştır
    staleTime: 5 * 60 * 1000, // 5 dakika boyunca veriyi önbellekte tutalım
    refetchOnWindowFocus: false, // Pencere odağı değiştiğinde yeniden sorgu yapmayalım
  });

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
            <BreadcrumbLink href="/dashboard/finance">Finans</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem isCurrentPage>
            <BreadcrumbLink>Ödemeler</BreadcrumbLink>
          </BreadcrumbItem>
        </Breadcrumb>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mt-2">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Ödeme Yönetimi</h1>
            <p className="text-muted-foreground mt-1">
              Ödemeleri takip edin ve yönetin.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant={showFilters ? "secondary" : "outline"}
              size="sm"
              className="text-xs sm:text-sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <FilterIcon className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              Filtrele
            </Button>
            <Button variant="outline" size="sm" className="text-xs sm:text-sm">
              <Download className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              Dışa Aktar
            </Button>
          </div>
        </div>
      </div>
      
      {showFilters && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Ödeme Filtreleri</CardTitle>
          </CardHeader>
          <CardContent>
            <PaymentFilters
              customers={customers}
              filters={filters}
              onFilterChange={setFilters}
              onResetFilters={() => setFilters({})}
            />
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="pending" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full overflow-x-auto flex flex-nowrap">
          <TabsTrigger value="pending" className="text-xs sm:text-sm flex-1">Bekleyen Ödemeler</TabsTrigger>
          <TabsTrigger value="completed" className="text-xs sm:text-sm flex-1">Tamamlanan Ödemeler</TabsTrigger>
          <TabsTrigger value="all" className="text-xs sm:text-sm flex-1">Tüm Ödemeler</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Bekleyen Ödemeler</CardTitle>
              <CardDescription>
                Ödenmemiş faturalar ve bekleyen ödemeler
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PaymentFlow
                pendingInvoices={pendingInvoices}
                isLoading={isLoadingInvoices}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="completed" className="space-y-4">
          <PaymentList
            payments={payments}
            isLoading={isLoading}
            status="completed"
            filters={filters}
          />
        </TabsContent>
        
        <TabsContent value="all" className="space-y-4">
          <PaymentList
            payments={payments}
            isLoading={isLoading}
            status="all"
            filters={filters}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
