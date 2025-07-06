"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { getCommissionRules } from "@/services/commission.service";
import { columns } from "@/components/commissions/rules-columns";
import { RulesDataTable } from "@/components/commissions/rules-data-table";
import { useSearchParams } from "next/navigation";
import { z } from "zod";

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

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["commission-rules", { page, limit }],
    queryFn: () => getCommissionRules({ page, limit }),
    keepPreviousData: true,
  });

  if (isLoading) {
    return <div>Yükleniyor...</div>;
  }

  if (isError) {
    return <div>Hata: {(error as any).message}</div>;
  }

  const pageCount = data ? Math.ceil(data.total / limit) : 0;

  return (
    <div className="container mx-auto py-10">
            <RulesDataTable
        data={data?.data ?? []}
        pageCount={pageCount}
      />
    </div>
  );
}
