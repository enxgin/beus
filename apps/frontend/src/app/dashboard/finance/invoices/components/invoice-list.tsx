"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import { Eye, FileText, CreditCard } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";

interface Invoice {
  id: string;
  totalAmount: number;
  amountPaid: number;
  debt: number;
  status: "PAID" | "UNPAID" | "PARTIALLY_PAID";
  createdAt: string;
  customer: {
    id: string;
    name: string;
  };
  appointment?: {
    id: string;
    service: {
      name: string;
    };
  };
  customerPackage?: {
    id: string;
    package: {
      name: string;
    };
  };
}

interface InvoiceListProps {
  invoices: Invoice[];
  isLoading: boolean;
  onOpenPaymentDialog: (invoiceId: string) => void;
}

export function InvoiceList({ invoices, isLoading, onOpenPaymentDialog }: InvoiceListProps) {
  const router = useRouter();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PAID":
        return <Badge className="bg-green-500">Ödenmiş</Badge>;
      case "UNPAID":
        return <Badge variant="destructive">Ödenmemiş</Badge>;
      case "PARTIALLY_PAID":
        return <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300">Kısmen Ödenmiş</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getInvoiceType = (invoice: Invoice) => {
    if (invoice.appointment) {
      return `Hizmet: ${invoice.appointment.service.name}`;
    } else if (invoice.customerPackage) {
      return `Paket: ${invoice.customerPackage.package.name}`;
    } else {
      return "Diğer";
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Faturalar Yükleniyor</CardTitle>
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

  if (invoices.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Fatura Bulunamadı</CardTitle>
          <CardDescription>
            Bu kriterlere uygun fatura bulunmamaktadır.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fatura Listesi</CardTitle>
        <CardDescription>
          Toplam {invoices.length} fatura listeleniyor
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fatura No</TableHead>
              <TableHead>Müşteri</TableHead>
              <TableHead>Tür</TableHead>
              <TableHead>Tutar</TableHead>
              <TableHead>Ödenen</TableHead>
              <TableHead>Kalan</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead>Tarih</TableHead>
              <TableHead>İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map((invoice) => (
              <TableRow key={invoice.id}>
                <TableCell className="font-medium">#{invoice.id.substring(0, 8)}</TableCell>
                <TableCell>{invoice.customer.name}</TableCell>
                <TableCell>{getInvoiceType(invoice)}</TableCell>
                <TableCell>{formatCurrency(invoice.totalAmount)}</TableCell>
                <TableCell>{formatCurrency(invoice.amountPaid)}</TableCell>
                <TableCell>{formatCurrency(invoice.debt)}</TableCell>
                <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                <TableCell>{new Date(invoice.createdAt).toLocaleDateString("tr-TR")}</TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => router.push(`/dashboard/finance/invoices/${invoice.id}`)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => onOpenPaymentDialog(invoice.id)}
                    >
                      <CreditCard className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
