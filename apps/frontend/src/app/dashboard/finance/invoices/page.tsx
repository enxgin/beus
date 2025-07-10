"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable } from "@/components/ui/data-table";
import { Plus, FileText, Download, HomeIcon } from "lucide-react";
import { columns } from "./components/columns";
import api from "@/lib/api";
import { InvoiceList } from "./components/invoice-list";
import { CreateInvoiceButton } from "./components/create-invoice-button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export default function InvoicesPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("all");

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ["invoices", activeTab],
    queryFn: async () => {
      const params = activeTab !== "all" ? { status: activeTab.toUpperCase() } : {};
      const response = await api.get("/invoices", { params });
      return response.data;
    },
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
            <BreadcrumbLink>Faturalar</BreadcrumbLink>
          </BreadcrumbItem>
        </Breadcrumb>
        <div className="flex items-center justify-between mt-2">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Faturalar</h1>
            <p className="text-muted-foreground mt-1">
              Fatura işlemlerinizi yönetin ve takip edin
            </p>
          </div>
          <div className="flex gap-2">
            <CreateInvoiceButton />
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Dışa Aktar
            </Button>
          </div>
        </div>
      </div>

      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">Tüm Faturalar</TabsTrigger>
          <TabsTrigger value="paid">Ödenmiş</TabsTrigger>
          <TabsTrigger value="unpaid">Ödenmemiş</TabsTrigger>
          <TabsTrigger value="partially_paid">Kısmen Ödenmiş</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <InvoiceList invoices={invoices} isLoading={isLoading} />
        </TabsContent>
        
        <TabsContent value="paid" className="space-y-4">
          <InvoiceList invoices={invoices} isLoading={isLoading} />
        </TabsContent>
        
        <TabsContent value="unpaid" className="space-y-4">
          <InvoiceList invoices={invoices} isLoading={isLoading} />
        </TabsContent>
        
        <TabsContent value="partially_paid" className="space-y-4">
          <InvoiceList invoices={invoices} isLoading={isLoading} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
