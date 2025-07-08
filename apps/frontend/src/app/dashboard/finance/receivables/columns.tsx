"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Receivable } from "@/hooks/use-receivables";
import { formatCurrency } from "@/utils/formatters";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import Link from "next/link";

export const columns: ColumnDef<Receivable>[] = [
  {
    accessorKey: "customerName",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Müşteri Adı
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const customer = row.original;
      return (
        <Link href={`/dashboard/customers/${customer.customerId}`}>
          <div className="font-medium text-blue-600 hover:underline">
            {customer.customerName}
          </div>
          <div className="text-xs text-muted-foreground">
            {customer.customerPhone}
          </div>
        </Link>
      );
    },
  },
  {
    accessorKey: "totalDebt",
    header: ({ column }) => (
      <div className="text-right">
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Toplam Borç
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      </div>
    ),
    cell: ({ row }) => {
      return <div className="text-right font-medium">{formatCurrency(row.getValue("totalDebt"))}</div>;
    },
  },
  {
    accessorKey: "totalPaid",
    header: () => <div className="text-right">Ödenen Tutar</div>,
    cell: ({ row }) => {
      return <div className="text-right">{formatCurrency(row.getValue("totalPaid"))}</div>;
    },
  },
  {
    accessorKey: "remainingDebt",
    header: ({ column }) => (
      <div className="text-right">
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Kalan Borç
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      </div>
    ),
    cell: ({ row }) => {
      const remainingDebt = row.getValue("remainingDebt") as number;
      return (
        <div className="text-right font-bold text-red-600">
          {formatCurrency(remainingDebt)}
        </div>
      );
    },
  },
  {
    accessorKey: "invoices",
    header: () => <div className="text-center">Borçlu Fatura Sayısı</div>,
    cell: ({ row }) => {
      const invoices = row.getValue("invoices") as any[];
      return <div className="text-center"><Badge>{invoices.length}</Badge></div>;
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const receivable = row.original;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Menüyü aç</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>İşlemler</DropdownMenuLabel>
            <DropdownMenuItem asChild>
               <Link href={`/dashboard/customers/${receivable.customerId}?tab=invoices`}>Müşteri Detayına Git</Link>
            </DropdownMenuItem>
             <DropdownMenuItem onClick={() => alert(`Ödeme al: ${receivable.customerName}`)}>
              Ödeme Al
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
