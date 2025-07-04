"use client";

import { getColumns } from "./components/columns";
import { DataTable } from "./components/data-table";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PlusCircle, Search } from "lucide-react";
import { useAuthStore } from "@/stores/auth.store";
import { Service } from "@/types/service";
import { useMemo, useState, useEffect } from "react";
import { useServices } from "./hooks/use-services";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";

const ServicesPage = () => {
  const { user, isHydrated } = useAuthStore();
  const { data: services = [], isLoading, isError, error } = useServices();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredData, setFilteredData] = useState<Service[]>([]);

  // useMemo, kullanıcı rolü değişmediği sürece kolonların yeniden hesaplanmasını engeller.
  const columns = useMemo(() => getColumns(user?.role || null), [user]);

  // Arama filtrelemesi
  useEffect(() => {
    if (!services) return;
    
    let filtered = services;
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((service: Service) => {
        return (
          service.name.toLowerCase().includes(query) ||
          service.category?.name.toLowerCase().includes(query) ||
          service.branch?.name.toLowerCase().includes(query)
        );
      });
    }
    
    setFilteredData(filtered);
  }, [searchQuery, services]);

  if (!isHydrated || isLoading) {
    return (
      <div className="container mx-auto py-10 space-y-6">
        <div className="flex justify-between items-center mb-6">
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    );
  }

  if (isError) {
    return <div className="p-4 text-red-500">Hata: {(error as Error).message}</div>;
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Hizmetler</h1>
        <Button asChild>
          <Link href="/dashboard/services/create">
            <PlusCircle className="mr-2 h-4 w-4" />
            Yeni Hizmet Ekle
          </Link>
        </Button>
      </div>
      
      {/* Arama barı */}
      <div className="flex items-center space-x-2 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Hizmet adı, kategori veya şube ile arama yapın..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      
      {/* Hizmetlerin sonuç sayısı */}
      {searchQuery && (
        <p className="text-sm text-muted-foreground mb-4">
          <span className="font-medium">{filteredData.length}</span> hizmet bulundu.
        </p>
      )}
      
      {/* Sonuç yoksa bilgi mesajı */}
      {filteredData.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-lg font-medium mb-2">Hiç hizmet bulunamadı</p>
          {searchQuery ? (
            <p className="text-sm text-muted-foreground">
              Arama kriterlerinize uygun hizmet bulunamadı. Lütfen farklı bir arama yapmayı deneyin.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Henüz hiç hizmet eklenmemiş. Yeni bir hizmet eklemek için "Yeni Hizmet Ekle" butonunu kullanın.
            </p>
          )}
        </div>
      ) : (
        <DataTable columns={columns} data={filteredData} />
      )}
    </div>
  );
};

export default ServicesPage;
