"use client";

import { useState, useEffect } from "react";
import { columns } from "./columns";
import { useReceivables, Receivable } from "@/hooks/use-receivables";
import { DataTable } from "@/components/ui/data-table"; // Genel DataTable bileşenini kullanıyoruz
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Search, HomeIcon } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export default function ReceivablesPage() {
  const { data: receivables, isLoading, isError, error } = useReceivables();
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredData, setFilteredData] = useState<Receivable[]>([]);

  useEffect(() => {
    if (receivables) {
      const filtered = receivables.filter(
        (r) =>
          r.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.customerPhone?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredData(filtered);
    }
  }, [searchQuery, receivables]);

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
            <BreadcrumbLink>Alacaklar</BreadcrumbLink>
          </BreadcrumbItem>
        </Breadcrumb>
        <h1 className="text-3xl font-bold tracking-tight mt-2">Alacak Yönetimi</h1>
        <p className="text-muted-foreground mt-1">
          Ödenmemiş veya kısmen ödenmiş faturaları olan müşterileri burada takip edin.
        </p>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 md:grow-0">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Müşteri adı veya telefon ile ara..."
            className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[320px]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : isError ? (
        <div className="rounded-md bg-destructive/15 p-4 text-center">
          <p className="text-destructive">
            Veriler yüklenirken bir hata oluştu: {error?.message || 'Bilinmeyen hata'}
          </p>
        </div>
      ) : (
        <DataTable data={filteredData} columns={columns} />
      )}
    </div>
  );
}
