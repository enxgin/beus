"use client";

import { ColumnDef } from "@tanstack/react-table";
import { CommissionRule } from "@/services/commission.service";
import { Badge } from "@/components/ui/badge";
import { DataTableColumnHeader } from "@/components/ui/data-table/data-table-column-header";

export const columns: ColumnDef<CommissionRule>[] = [
  {
    accessorKey: "type",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Kural Tipi" />
    ),
    cell: ({ row }) => {
      const rule = row.original;
      let typeText = "Bilinmiyor";
      if (rule.isGlobal) typeText = "Genel";
      else if (rule.service) typeText = `Hizmet: ${rule.service.name}`;
      else if (rule.user) typeText = `Personel: ${rule.user.name}`;
      
      return <Badge variant="outline">{typeText}</Badge>;
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: "value",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Değer" />
    ),
    cell: ({ row }) => {
      const rule = row.original;
      const valueText = rule.type === 'PERCENTAGE' ? `%${rule.value}` : `${rule.value} TL`;
      return <span>{valueText}</span>;
    },
  },
  {
    accessorKey: "description",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Açıklama" />
    ),
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Oluşturma Tarihi" />
    ),
    cell: ({ row }) => {
      return <span>{new Date(row.original.createdAt).toLocaleDateString()}</span>;
    },
  },
  ];
