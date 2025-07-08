"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { columns } from "./components/columns";
import { DataTable } from "./components/data-table";
import { useCustomers } from "./hooks/use-customers";
import { useBranches } from "@/hooks/use-branches"; // Şubeleri çekmek için hook
import { Skeleton } from "@/components/ui/skeleton";
import { Search, HomeIcon } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"; // Filtre için Select bileşeni
import { UserRole } from "@/types/user"; // Rol enum'ı
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Customer } from "./data/schema";

// Sadece gerekli hook'u import ediyoruz
import { useAuth } from "@/hooks/use-auth";

export default function CustomersPage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBranch, setSelectedBranch] = useState<string | undefined>(
    undefined
  );

  // Rol bazlı filtreleme yetkisi
  const canFilterBranches = user?.role === UserRole.ADMIN || user?.role === UserRole.SUPER_BRANCH_MANAGER;

  // Şube filtresi için şubeleri çek
  const { data: branches, isLoading: isLoadingBranches } = useBranches(user);

  // Müşterileri, seçilen şubeye göre çek
  const { data: customers, isLoading, isError, error } = useCustomers(
    selectedBranch
  );

  const [filteredData, setFilteredData] = useState(customers || []);

  useEffect(() => {
    if (!customers) return;

    let filtered = customers;
    
    // Sadece arama sorgusuna göre filtrele
    // Şube filtrelemesi useCustomers hook'unda yapılıyor
    if (searchQuery) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((customer: Customer) => {
        return (
          customer.name.toLowerCase().includes(query) ||
          (customer.phone && customer.phone.toLowerCase().includes(query))
        );
      });
    }
    
    setFilteredData(filtered);
  }, [searchQuery, customers]);

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
          <BreadcrumbItem isCurrentPage>
            <BreadcrumbLink>Müşteriler</BreadcrumbLink>
          </BreadcrumbItem>
        </Breadcrumb>
        <h1 className="text-3xl font-bold tracking-tight mt-2">Müşteri Yönetimi</h1>
        <p className="text-muted-foreground mt-1">
          Mevcut müşterilerinizi burada yönetin ve yeni müşteri ekleyin.
        </p>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-1 items-center gap-4">
          <div className="relative flex-1 md:grow-0">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="İsim veya telefon ile ara..."
              className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[320px]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          {/* Sadece yetkili roller için şube filtresini göster */}
          {canFilterBranches && (
            <Select
              onValueChange={(value) =>
                setSelectedBranch(value === "all" ? undefined : value)
              }
              defaultValue="all"
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Şube Filtrele" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Şubeler</SelectItem>
                {branches?.map((branch) => (
                  <SelectItem key={branch.id} value={branch.id}>
                    {branch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        <Button asChild>
          <Link href="/dashboard/customers/new">Yeni Müşteri Ekle</Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : isError ? (
        <div className="rounded-md bg-destructive/15 p-4 text-center">
          <p className="text-destructive">
            Müşteriler yüklenirken bir hata oluştu: {error?.message || 'Bilinmeyen hata'}
          </p>
        </div>
      ) : (
        <DataTable data={filteredData as any} columns={columns} />
      )}
    </div>
  );
}
