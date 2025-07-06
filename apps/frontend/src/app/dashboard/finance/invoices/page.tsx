"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable } from "@/components/ui/data-table";
import { Plus, FileText, Download } from "lucide-react";
import { columns } from "./components/columns";
import api from "@/lib/api";
import { InvoiceList } from "./components/invoice-list";
import { CreateInvoiceButton } from "./components/create-invoice-button";

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
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Faturalar</h1>
        <div className="flex gap-2">
          <CreateInvoiceButton />
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Dışa Aktar
          </Button>
        </div>
      </div>

      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
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
