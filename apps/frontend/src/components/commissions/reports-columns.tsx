"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Commission } from "@/services/commission.service";
import { Badge } from "@/components/ui/badge";
import { DataTableColumnHeader } from "@/components/ui/data-table/data-table-column-header";
import { ReportsTableRowActions } from "./reports-table-row-actions";

const statusMap: { [key: string]: { text: string; variant: "default" | "secondary" | "destructive" | "outline" } } = {
  PENDING: { text: "Beklemede", variant: "secondary" },
  APPROVED: { text: "Onaylandı", variant: "outline" },
  PAID: { text: "Ödendi", variant: "default" },
  CANCELED: { text: "İptal Edildi", variant: "destructive" },
};

export const columns: ColumnDef<Commission>[] = [
  {
    accessorKey: "staff",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Personel" />
    ),
    cell: ({ row }) => row.original.staff.name,
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="İşlem Tarihi" />
    ),
    cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString(),
  },
  {
    accessorKey: "service",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Hizmet" />
    ),
    cell: ({ row }) => row.original.service.name,
  },
  {
    accessorKey: "amount",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Prim Tutarı" />
    ),
    cell: ({ row }) => {
      return new Intl.NumberFormat("tr-TR", {
        style: "currency",
        currency: "TRY",
      }).format(row.original.amount);
    },
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Durum" />
    ),
    cell: ({ row }) => {
      const statusInfo = statusMap[row.original.status];
      return <Badge variant={statusInfo.variant}>{statusInfo.text}</Badge>;
    },
  },
  {
    id: "actions",
    cell: ({ row }) => <ReportsTableRowActions row={row} />,
  },
];
