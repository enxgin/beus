"use client";

import { useReceivables } from "@/hooks/use-receivables";
import { DataTable } from "@/components/ui/data-table";
import { Skeleton } from "@/components/ui/skeleton";
import { HomeIcon } from "lucide-react";
import { columns } from "./columns";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export default function ReceivablesPage() {
  const { data: receivables, isLoading, isError, error } = useReceivables();

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
            <BreadcrumbLink>Borçlu Müşteriler</BreadcrumbLink>
          </BreadcrumbItem>
        </Breadcrumb>
        <h1 className="text-3xl font-bold tracking-tight mt-2">Alacak Yönetimi</h1>
        <p className="text-muted-foreground mt-1">
          Borçlu olan müşterileri burada takip edin.
        </p>
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
        <DataTable 
          data={receivables || []} 
          columns={columns}
          searchKey="customerName"
        />
      )}
    </div>
  );
}
