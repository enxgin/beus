"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { z } from "zod";
import { getCommissions } from "@/services/commission.service";
import { columns } from "@/components/commissions/reports-columns";
import { ReportsDataTable } from "@/components/commissions/reports-data-table";
import { ReportsFilters } from "@/components/commissions/reports-filters";

const schema = z.object({
  page: z.coerce.number().default(1),
  limit: z.coerce.number().default(10),
  userId: z.string().optional(),
  status: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export default function CommissionReportsPage() {
  const searchParams = useSearchParams();
  const parsedParams = schema.safeParse(Object.fromEntries(searchParams.entries()));

  if (!parsedParams.success) {
    return <div>Geçersiz parametreler.</div>;
  }

  const { page, limit, ...filters } = parsedParams.data;

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["commissions", { page, limit, ...filters }],
    queryFn: () => getCommissions({ page, limit, ...filters }),
    staleTime: 0, // Her zaman güncel veri almak için
    refetchOnMount: true, // Bileşen mount olduğunda yeniden veri çek
    refetchOnWindowFocus: true, // Pencere odaklandığında yeniden veri çek
  });
  
  // Sayfa yüklendiğinde verileri yeniden çek
  React.useEffect(() => {
    console.log('Prim raporları sayfası yüklendi, veriler yenileniyor...');
    refetch();
  }, [refetch]);
  
  // Filtrelerde değişiklik olduğunda loglama yap
  React.useEffect(() => {
    console.log('Prim raporları filtreleri değişti:', { page, limit, ...filters });
  }, [page, limit, filters]);

  if (isLoading) {
    return <div>Yükleniyor...</div>;
  }

  if (isError) {
    return <div>Hata: {(error as any).message}</div>;
  }

  const pageCount = data ? Math.ceil(data.total / limit) : 0;

  return (
    <div className="container mx-auto py-10">
            <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold tracking-tight">Prim Raporları</h2>
      </div>
      <ReportsFilters />
      <ReportsDataTable
        columns={columns}
        data={data?.data ?? []}
        pageCount={pageCount}
      />
    </div>
  );
}
