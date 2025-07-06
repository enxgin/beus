"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, FileText } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";

interface Payment {
  id: string;
  amount: number;
  method: "CASH" | "CREDIT_CARD" | "BANK_TRANSFER" | "CUSTOMER_CREDIT";
  createdAt?: string;
  paymentDate?: string; // Backend'den gelen ödeme tarihi
  note?: string;
  invoiceNumber?: string;
  // API'den gelen verilerde invoice ve customer alanları opsiyonel olabilir
  invoice?: {
    id: string;
    number?: string;
    totalAmount?: number;
    status?: "PAID" | "UNPAID" | "PARTIALLY_PAID";
  };
  customer?: {
    id?: string;
    name?: string;
  };
}

interface PaymentListProps {
  payments: Payment[];
  isLoading: boolean;
  status: "all" | "completed" | "pending";
  filters?: {
    startDate?: Date;
    endDate?: Date;
    customerId?: string;
    customerName?: string;
    method?: string;
  };
}

export function PaymentList({ payments, isLoading, status, filters }: PaymentListProps) {
  const router = useRouter();
  
  // Apply filters to payments if filters are provided
  const filteredPayments = payments.filter(payment => {
    // If no filters are applied, return all payments
    if (!filters) return true;
    
    // Filter by date range
    if (filters.startDate && payment.paymentDate) {
      const paymentDate = new Date(payment.paymentDate);
      if (paymentDate < filters.startDate) return false;
    }
    
    if (filters.endDate && payment.paymentDate) {
      const paymentDate = new Date(payment.paymentDate);
      // Include the end date fully (end of day)
      const endOfDay = new Date(filters.endDate);
      endOfDay.setHours(23, 59, 59, 999);
      if (paymentDate > endOfDay) return false;
    }
    
    // Filter by customer
    if (filters.customerId && payment.customer?.id !== filters.customerId) {
      return false;
    }
    
    // Filter by payment method
    if (filters.method && payment.method !== filters.method) {
      return false;
    }
    
    return true;
  });

  const getMethodBadge = (method: string) => {
    switch (method) {
      case "CASH":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Nakit</Badge>;
      case "CREDIT_CARD":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Kredi Kartı</Badge>;
      case "BANK_TRANSFER":
        return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Banka Transferi</Badge>;
      case "CUSTOMER_CREDIT":
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Müşteri Kredisi</Badge>;
      default:
        return <Badge variant="outline">{method}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Ödemeler Yükleniyor</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array(5).fill(0).map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[250px]" />
                  <Skeleton className="h-4 w-[200px]" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (filteredPayments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Ödeme Bulunamadı</CardTitle>
          <CardDescription>
            {status === "completed" 
              ? "Tamamlanan ödeme bulunmamaktadır." 
              : status === "pending" 
                ? "Bekleyen ödeme bulunmamaktadır." 
                : "Hiç ödeme kaydı bulunmamaktadır."}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg sm:text-xl">Ödeme Listesi</CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          Toplam {filteredPayments.length} ödeme listeleniyor
        </CardDescription>
      </CardHeader>
      <CardContent className="px-2 sm:px-6">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="hidden sm:table-cell">Ödeme No</TableHead>
                <TableHead>Müşteri</TableHead>
                <TableHead className="hidden md:table-cell">Fatura No</TableHead>
                <TableHead>Tutar</TableHead>
                <TableHead className="hidden sm:table-cell md:table-cell">Ödeme Yöntemi</TableHead>
                <TableHead className="hidden lg:table-cell">Tarih</TableHead>
                <TableHead className="w-[60px] md:w-[80px]">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell className="hidden sm:table-cell font-medium text-xs sm:text-sm">
                    {/* Ödeme numarası olarak payment.id kullanılıyor */}
                    {payment.id ? `#${payment.id.substring(0, 8)}` : "-"}
                  </TableCell>
                  <TableCell className="text-xs sm:text-sm max-w-[100px] sm:max-w-[150px] truncate">
                    {payment.customer?.name || "Bilinmeyen Müşteri"}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {/* Fatura numarası olarak invoice.id kullanılıyor */}
                    {payment.invoice?.id ? (
                      <Button 
                        variant="link" 
                        className="p-0 h-auto text-xs sm:text-sm"
                        onClick={() => payment.invoice?.id && router.push(`/dashboard/finance/invoices/${payment.invoice.id}`)}
                      >
                        #{payment.invoice.id.substring(0, 8)}
                      </Button>
                    ) : (
                      <span className="text-xs sm:text-sm text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs sm:text-sm whitespace-nowrap">
                    {/* Tutar için sıkı kontrol */}
                    {typeof payment.amount === 'number' && !isNaN(payment.amount) ? 
                      formatCurrency(payment.amount) : 
                      "₺0,00"}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell md:table-cell">
                    {/* Ödeme yöntemi için sıkı kontrol */}
                    {payment.method ? getMethodBadge(payment.method) : "-"}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-xs sm:text-sm whitespace-nowrap">
                    {payment.paymentDate ? new Date(payment.paymentDate).toLocaleDateString("tr-TR") : 
                     payment.createdAt ? new Date(payment.createdAt).toLocaleDateString("tr-TR") : "-"}
                  </TableCell>
                  <TableCell className="p-2 md:p-4">
                    <div className="flex justify-center md:justify-start space-x-1 sm:space-x-2">
                      {payment.invoice?.id ? (
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-7 w-7 sm:h-8 sm:w-8"
                          onClick={() => payment.invoice?.id && router.push(`/dashboard/finance/invoices/${payment.invoice.id}`)}
                          title="Faturayı Görüntüle"
                        >
                          <FileText className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                      ) : (
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-7 w-7 sm:h-8 sm:w-8 opacity-50"
                          disabled
                          title="Fatura Mevcut Değil"
                        >
                          <FileText className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
