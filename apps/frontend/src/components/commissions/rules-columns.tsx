"use client";

import { ColumnDef } from "@tanstack/react-table";
import { CommissionRule } from "@/services/commission.service";
import { Badge } from "@/components/ui/badge";
import { DataTableColumnHeader } from "@/components/ui/data-table/data-table-column-header";

export const columns: ColumnDef<CommissionRule>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Kural Adı" />
    ),
    cell: ({ row }) => {
      const rule = row.original;
      return <span className="font-medium">{rule.name}</span>;
    },
  },
  {
    accessorKey: "ruleType",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Kural Tipi" />
    ),
    cell: ({ row }) => {
      const rule = row.original;
      const ruleTypeMap = {
        'GENERAL': { text: 'Genel Kural', variant: 'secondary' as const },
        'SERVICE_SPECIFIC': { text: 'Hizmet Özel', variant: 'default' as const },
        'STAFF_SPECIFIC': { text: 'Personel Özel', variant: 'destructive' as const }
      };
      const ruleTypeInfo = ruleTypeMap[rule.ruleType] || { text: 'Bilinmeyen', variant: 'outline' as const };
      return <Badge variant={ruleTypeInfo.variant}>{ruleTypeInfo.text}</Badge>;
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: "type",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Prim Tipi" />
    ),
    cell: ({ row }) => {
      const rule = row.original;
      const typeText = rule.type === 'PERCENTAGE' ? 'Yüzdelik (%)' : 'Sabit Tutar (TL)';
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
      // Yeni schema'ya göre rate ve fixedAmount alanlarını kullan
      const valueText = rule.type === 'PERCENTAGE'
        ? `%${rule.rate || 0}`
        : `${rule.fixedAmount || 0} TL`;
      return <span>{valueText}</span>;
    },
  },
  {
    accessorKey: "target",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Hedef" />
    ),
    cell: ({ row }) => {
      const rule = row.original;
      if (rule.ruleType === 'GENERAL') {
        return <span className="text-muted-foreground">Tüm personel</span>;
      } else if (rule.ruleType === 'SERVICE_SPECIFIC' && rule.service) {
        return <span>{rule.service.name}</span>;
      } else if (rule.ruleType === 'STAFF_SPECIFIC' && rule.staffMember) {
        return <span>{rule.staffMember.name}</span>;
      }
      return <span className="text-muted-foreground">-</span>;
    },
  },
  {
    accessorKey: "isActive",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Durum" />
    ),
    cell: ({ row }) => {
      const rule = row.original;
      return (
        <Badge variant={rule.isActive ? "default" : "secondary"}>
          {rule.isActive ? "Aktif" : "Pasif"}
        </Badge>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
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
