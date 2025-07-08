"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { useAuthStore } from "@/stores/auth.store";

// Backend'den gelen veri tipini tanımlayalım
export interface Receivable {
  customerId: string;
  customerName: string;
  customerPhone: string;
  totalDebt: number;
  totalPaid: number;
  remainingDebt: number;
  invoices: {
    invoiceId: string;
    invoiceNumber: string;
    totalAmount: number;
    paidAmount: number;
    remainingAmount: number;
    status: string;
    createdAt: string;
  }[];
}

const fetchReceivables = async (): Promise<Receivable[]> => {
  const { data } = await api.get("/finance/receivables");
  return data;
};

export function useReceivables() {
  const token = useAuthStore((state) => state.token);

  return useQuery<Receivable[], Error>({
    queryKey: ["receivables", token],
    queryFn: fetchReceivables,
    enabled: !!token, // Sadece token varsa çalıştır
    staleTime: 1000 * 60 * 5, // 5 dakika
  });
}
