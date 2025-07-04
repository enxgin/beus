"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { columns } from "./components/columns";
import { DataTable } from "./components/data-table";
import { useCustomers } from "./hooks/use-customers";
import { Skeleton } from "@/components/ui/skeleton";
import { Search } from "lucide-react";
import { Customer } from "./data/schema";

// Sadece gerekli hook'u import ediyoruz
import { useAuth } from "@/hooks/use-auth";

export default function CustomersPage() {
  const { data: customers, isLoading, isError, error } = useCustomers();
  const { user } = useAuth();

  const [searchQuery, setSearchQuery] = useState("");
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
    <div >
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Müşteriler</h2>
          <p className="text-muted-foreground">
            Mevcut müşterilerinizi burada yönetin ve yeni müşteri ekleyin.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button asChild>
            <Link href="/dashboard/customers/new">Yeni Müşteri Ekle</Link>
          </Button>
        </div>
      </div>
      
      <div className="flex items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="İsim veya telefon ile ara..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      ) : isError ? (
        <div className="rounded-md bg-destructive/15 p-4">
          <p className="text-destructive">
            Müşteriler yüklenirken bir hata oluştu: {error?.message || 'Bilinmeyen hata'}
          </p>
        </div>
      ) : (
        <DataTable data={filteredData} columns={columns} />
      )}
    </div>
  );
}
