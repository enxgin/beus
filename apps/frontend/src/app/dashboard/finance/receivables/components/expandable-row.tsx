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
    return new Date(dateString).toLocaleDateString("tr-TR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

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
            )}
            {customer.email && (
              <span className="text-xs text-muted-foreground">{customer.email}</span>
            )}
          </div>
        </TableCell>
        <TableCell className="text-right font-medium">
          {formatCurrency(customer.totalDue)}
        </TableCell>
        <TableCell>
          <div className="flex flex-col">
            {customer.unpaidInvoices > 0 && (
              <Badge variant="destructive" className="w-fit mb-1">
                {customer.unpaidInvoices} Ödenmemiş
              </Badge>
            )}
            {customer.partiallyPaidInvoices > 0 && (
              <Badge variant="outline" className="w-fit">
                {customer.partiallyPaidInvoices} Kısmen Ödenmiş
              </Badge>
            )}
          </div>
        </TableCell>
        <TableCell>
          {customer.lastInvoiceDate
            ? formatDate(customer.lastInvoiceDate)
            : "-"}
        </TableCell>
        <TableCell className="text-right">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/dashboard/customers/${customer.id}`);
            }}
          >
            <Eye className="h-4 w-4" />
          </Button>
        </TableCell>
      </TableRow>

      {isExpanded && (
        <TableRow>
          <TableCell colSpan={5} className="p-0 bg-muted/30">
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="px-10 py-4 overflow-x-auto"
            >
              <h4 className="text-sm font-medium mb-2">Fatura Detayları</h4>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Fatura No</TableHead>
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
                    <TableRow key={invoice.id}>
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
                        {formatCurrency(invoice.dueAmount)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() =>
                            router.push(`/dashboard/finance/invoices/${invoice.id}`)
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