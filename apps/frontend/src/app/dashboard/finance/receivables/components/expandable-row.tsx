"use client";

import { Row } from "@tanstack/react-table";
import { Receivable as CustomerReceivable } from "@/hooks/use-receivables";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight, Eye } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

interface ExpandableRowProps {
  row: Row<CustomerReceivable>;
  isExpanded: boolean;
  onToggle: () => void;
}

export function ExpandableRow({ row, isExpanded, onToggle }: ExpandableRowProps) {
  const router = useRouter();
  const customer = row.original;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "UNPAID":
        return <Badge variant="destructive">Ödenmemiş</Badge>;
      case "PARTIALLY_PAID":
        return <Badge variant="outline">Kısmen Ödenmiş</Badge>;
      default:
        return <Badge>Ödenmiş</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("tr-TR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // Derived stats from invoices
  const unpaidInvoices = customer.invoices.filter(inv => inv.status === 'UNPAID').length;
  const partiallyPaidInvoices = customer.invoices.filter(inv => inv.status === 'PARTIALLY_PAID').length;
  const lastInvoiceDate = customer.invoices.length > 0 
    ? customer.invoices.reduce((latest, inv) => new Date(inv.createdAt) > new Date(latest.createdAt) ? inv : latest).createdAt
    : null;

  return (
    <>
      <TableRow
        className={`cursor-pointer ${isExpanded ? "bg-muted/50" : ""} hover:bg-muted/50`}
        onClick={onToggle}
      >
        <TableCell className="px-4 py-3 flex items-center">
          <Button variant="ghost" size="sm" className="p-0 mr-2">
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
          <div className="flex flex-col">
            <span className="font-medium">{customer.customerName}</span>
            {customer.customerPhone && (
              <span className="text-xs text-muted-foreground">{customer.customerPhone}</span>
<<<<<<< HEAD
=======
            )}
            {customer.email && (
              <span className="text-xs text-muted-foreground">{customer.email}</span>
>>>>>>> f01bdfa0c26f96d501eef3a61768e14ee5222fd0
            )}
          </div>
        </TableCell>
        <TableCell className="text-right font-medium">{formatCurrency(customer.totalDebt)}</TableCell>
        <TableCell className="text-right">{formatCurrency(customer.totalPaid)}</TableCell>
        <TableCell className="text-right font-bold text-red-600">{formatCurrency(customer.remainingDebt)}</TableCell>
        <TableCell className="text-center"><Badge>{customer.invoices.length}</Badge></TableCell>
      </TableRow>

      {isExpanded && (
        <TableRow className="bg-muted/20 hover:bg-muted/20">
          <TableCell colSpan={5} className="p-0">
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="overflow-hidden p-4"
            >
              <h4 className="font-semibold mb-2">Müşteri Borç Detayları</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                  <div>
                      <p className="text-muted-foreground">Toplam Borç</p>
                      <p className="font-semibold">{formatCurrency(customer.totalDebt)}</p>
                  </div>
                  <div>
                      <p className="text-muted-foreground">Ödenmemiş Fatura</p>
                      <p className="font-semibold">{unpaidInvoices} adet</p>
                  </div>
                  <div>
                      <p className="text-muted-foreground">Kısmi Ödenmiş Fatura</p>
                      <p className="font-semibold">{partiallyPaidInvoices} adet</p>
                  </div>
                  <div>
                      <p className="text-muted-foreground">Son Fatura Tarihi</p>
                      <p className="font-semibold">
                        {lastInvoiceDate ? formatDate(lastInvoiceDate) : "-"}
                      </p>
                  </div>
              </div>

              <h4 className="font-semibold mb-2 mt-4">Faturalar</h4>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fatura No</TableHead>
                    <TableHead>Tarih</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead className="text-right">Toplam</TableHead>
                    <TableHead className="text-right">Ödenmiş</TableHead>
                    <TableHead className="text-right">Kalan</TableHead>
                    <TableHead className="w-[80px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customer.invoices.map((invoice) => (
                    <TableRow key={invoice.invoiceId}>
                      <TableCell className="font-medium">
                        {invoice.invoiceNumber}
                      </TableCell>
                      <TableCell>{formatDate(invoice.createdAt)}</TableCell>
                      <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(invoice.totalAmount)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(invoice.paidAmount)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(invoice.remainingAmount)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() =>
                            router.push(`/dashboard/finance/invoices/${invoice.invoiceId}`)
                          }
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </motion.div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}
