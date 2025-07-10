"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { getCommissionRules, PaginatedCommissionRules } from "@/services/commission.service";
import { columns } from "@/components/commissions/rules-columns";
import { RulesDataTable } from "@/components/commissions/rules-data-table";
import { useSearchParams } from "next/navigation";
import { z } from "zod";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { HomeIcon } from "lucide-react";

const schema = z.object({
  page: z.coerce.number().default(1),
  limit: z.coerce.number().default(10),
});

export default function CommissionRulesPage() {
  const searchParams = useSearchParams();
  const parsedParams = schema.safeParse(Object.fromEntries(searchParams.entries()));

  if (!parsedParams.success) {
    console.error("Invalid search params", parsedParams.error);
    return <div>Geçersiz parametreler.</div>;
  }
  
  const { page, limit } = parsedParams.data;

  const { data, isLoading, isError, error, refetch } = useQuery<PaginatedCommissionRules>({
    queryKey: ["commission-rules", { page, limit }],
    queryFn: () => getCommissionRules({ page, limit }),
    staleTime: 0, // Her zaman güncel veri almak için
    refetchOnMount: true, // Bileşen mount olduğunda yeniden veri çek
  });
  
  // Sayfa yüklendiğinde verileri yeniden çek
  React.useEffect(() => {
    refetch();
  }, [refetch]);

  if (isLoading) {
    return <div>Yükleniyor...</div>;
  }

  if (isError) {
    return <div>Hata: {(error as any).message}</div>;
  }

  const pageCount = data ? Math.ceil(data.total / limit) : 0;

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
            <BreadcrumbLink href="/dashboard/commissions">Primler</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem isCurrentPage>
            <BreadcrumbLink>Kurallar</BreadcrumbLink>
          </BreadcrumbItem>
        </Breadcrumb>
        <h1 className="text-3xl font-bold tracking-tight mt-2">Prim Kuralları</h1>
        <p className="text-muted-foreground mt-1">
          Prim hesaplama kurallarını yönetin ve düzenleyin
        </p>
      </div>

      <RulesDataTable
        data={data?.data ?? []}
        pageCount={pageCount}
      />
    </div>
  );
}
