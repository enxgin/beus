"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Eye, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

type Invoice = {
  id: string;
  invoiceNumber: string;
  status: "PAID" | "UNPAID" | "PARTIALLY_PAID";
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  createdAt: string;
};

type CustomerInvoicesDetailProps = {
  customer: {
    id: string;
    name: string;
    invoices: Invoice[];
  };
};

export function CustomerInvoicesDetail({ customer }: CustomerInvoicesDetailProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  const statusBadgeVariant = (status: string) => {
    switch (status) {
      case "UNPAID":
        return "destructive";
      case "PARTIALLY_PAID":
        return "outline";
      case "PAID":
        return "default";
      default:
        return "secondary";
    }
  };

  const statusText = (status: string) => {
    switch (status) {
      case "UNPAID":
        return "Ödenmemiş";
      case "PARTIALLY_PAID":
        return "Kısmen Ödenmiş";
      case "PAID":
        return "Ödenmiş";
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("tr-TR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8">
          <Eye className="mr-2 h-4 w-4" />
          Faturaları Görüntüle
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="mb-4">
            {customer.name} - Ödenmemiş ve Kısmen Ödenmiş Faturalar
          </DialogTitle>
        </DialogHeader>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fatura No</TableHead>
                <TableHead>Tarih</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead className="text-right">Toplam Tutar</TableHead>
                <TableHead className="text-right">Ödenmiş Tutar</TableHead>
                <TableHead className="text-right">Kalan Tutar</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customer.invoices.map((invoice) => (
                <motion.tr
                  key={invoice.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className="border-b"
                >
                  <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                  <TableCell>{formatDate(invoice.createdAt)}</TableCell>
                  <TableCell>
                    <Badge variant={statusBadgeVariant(invoice.status)}>
                      {statusText(invoice.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">{formatCurrency(invoice.totalAmount)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(invoice.paidAmount)}</TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(invoice.dueAmount)}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setIsOpen(false);
                        router.push(`/dashboard/finance/invoices/${invoice.id}`);
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </motion.tr>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="flex justify-between mt-4">
          <div className="text-sm text-muted-foreground">
            Toplam {customer.invoices.length} fatura listeleniyor
          </div>
          <Button
            onClick={() => {
              setIsOpen(false);
              router.push(`/dashboard/finance/invoices/new?customerId=${customer.id}`);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Yeni Fatura Oluştur
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}