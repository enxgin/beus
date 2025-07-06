"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, CreditCard } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export type Invoice = {
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
};

export const columns: ColumnDef<Invoice>[] = [
  {
    accessorKey: "id",
    header: "Fatura No",
    cell: ({ row }) => <div className="font-medium">#{row.original.id.substring(0, 8)}</div>,
  },
  {
    accessorKey: "customer.name",
    header: "Müşteri",
  },
  {
    id: "type",
    header: "Tür",
    cell: ({ row }) => {
      const invoice = row.original;
      if (invoice.appointment) {
        return `Hizmet: ${invoice.appointment.service.name}`;
      } else if (invoice.customerPackage) {
        return `Paket: ${invoice.customerPackage.package.name}`;
      } else {
        return "Diğer";
      }
    },
  },
  {
    accessorKey: "totalAmount",
    header: "Tutar",
    cell: ({ row }) => formatCurrency(row.original.totalAmount),
  },
  {
    accessorKey: "amountPaid",
    header: "Ödenen",
    cell: ({ row }) => formatCurrency(row.original.amountPaid),
  },
  {
    accessorKey: "debt",
    header: "Kalan",
    cell: ({ row }) => formatCurrency(row.original.debt),
  },
  {
    accessorKey: "status",
    header: "Durum",
    cell: ({ row }) => {
      const status = row.original.status;
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
    },
  },
  {
    accessorKey: "createdAt",
    header: "Tarih",
    cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString("tr-TR"),
  },
  {
    id: "actions",
    header: "İşlemler",
    cell: ({ row }) => {
      const invoice = row.original;
      
      return (
        <div className="flex space-x-2">
          <Button 
            variant="ghost" 
            size="icon"
            asChild
          >
            <a href={`/dashboard/finance/invoices/${invoice.id}`}>
              <Eye className="h-4 w-4" />
            </a>
          </Button>
          <Button 
            variant="ghost" 
            size="icon"
            asChild
          >
            <a href={`/dashboard/finance/invoices/${invoice.id}/payment`}>
              <CreditCard className="h-4 w-4" />
            </a>
          </Button>
        </div>
      );
    },
  },
];
