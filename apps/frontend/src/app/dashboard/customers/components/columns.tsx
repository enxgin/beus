"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { DataTableColumnHeader } from "./data-table-column-header"
import { DataTableRowActions } from "./data-table-row-actions"
import { Customer, Tag } from "@prisma/client"
import { format } from "date-fns"
import { tr } from "date-fns/locale"

export type CustomerWithTags = Customer & {
  tags: Tag[]
  analytics?: {
    totalAppointments: number
    lastAppointment: Date | null
    totalSpent: number
    totalDebt: number
  }
}

export const columns: ColumnDef<CustomerWithTags>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
        className="translate-y-[2px]"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
        className="translate-y-[2px]"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Müşteri" />
    ),
    cell: ({ row }) => {
      return (
        <div className="flex space-x-2">
          <span className="max-w-[500px] truncate font-medium">
            {row.getValue("name")}
          </span>
        </div>
      )
    },
  },
  {
    accessorKey: "phone",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Telefon" />
    ),
    cell: ({ row }) => {
      return (
        <div className="flex space-x-2">
          <span className="max-w-[500px] truncate font-medium">
            {row.getValue("phone")}
          </span>
        </div>
      )
    },
  },
  {
    accessorKey: "tags",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Etiketler" />
    ),
    cell: ({ row }) => {
      // ZodError ve key hatasını önlemek için gelen veriyi güvenli bir şekilde işle
      const tags = row.original.tags;

      // `tags` verisinin bir dizi olduğundan ve boş olmadığından emin ol
      if (!Array.isArray(tags) || tags.length === 0) {
        return null;
      }

      return (
        <div className="flex flex-wrap gap-1">
          {tags.map((tag, index) => {
            // İki farklı etiket formatını destekle:
            // 1. Backend'den gelen format: { id, name, color }
            // 2. Frontend'de oluşturulan format: { name, color }
            if (typeof tag === 'object' && tag !== null) {
              // Etiket nesnesinde name varsa kullan
              if ('name' in tag) {
                // Stil için color varsa kullan, yoksa varsayılan renk
                const style = 'color' in tag && tag.color 
                  ? { backgroundColor: tag.color, color: '#fff', borderColor: tag.color } 
                  : {};
                
                // Key için id varsa kullan, yoksa index
                const key = 'id' in tag && tag.id ? tag.id : `tag-${index}`;
                
                return (
                  <Badge key={key} variant="outline" style={style}>
                    {tag.name}
                  </Badge>
                );
              }
            }
            
            // Beklenmedik bir format gelirse, en azından çökmemesi için index'i key olarak kullan
            return (
              <Badge key={index} variant="destructive">
                Hatalı Etiket
              </Badge>
            );
          })}
        </div>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  },
  {
    accessorKey: "analytics.totalAppointments",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Toplam Randevu" />
    ),
    cell: ({ row }) => {
      const totalAppointments = row.original.analytics?.totalAppointments || 0;
      return (
        <div className="text-center">
          <span className="font-medium">{totalAppointments}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "analytics.lastAppointment",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Son Randevu" />
    ),
    cell: ({ row }) => {
      const lastAppointment = row.original.analytics?.lastAppointment;
      if (!lastAppointment) {
        return <span className="text-muted-foreground">-</span>;
      }
      return (
        <span className="text-sm">
          {format(new Date(lastAppointment), "dd MMM yyyy", { locale: tr })}
        </span>
      );
    },
  },
  {
    accessorKey: "analytics.totalSpent",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Toplam Harcama" />
    ),
    cell: ({ row }) => {
      const totalSpent = row.original.analytics?.totalSpent || 0;
      return (
        <div className="text-right">
          <span className="font-medium">
            {new Intl.NumberFormat('tr-TR', {
              style: 'currency',
              currency: 'TRY'
            }).format(totalSpent)}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "analytics.totalDebt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Borç Durumu" />
    ),
    cell: ({ row }) => {
      const totalDebt = row.original.analytics?.totalDebt || 0;
      if (totalDebt === 0) {
        return <Badge variant="secondary">Borç Yok</Badge>;
      }
      return (
        <div className="text-right">
          <Badge variant="destructive">
            {new Intl.NumberFormat('tr-TR', {
              style: 'currency',
              currency: 'TRY'
            }).format(totalDebt)}
          </Badge>
        </div>
      );
    },
  },
  {
    accessorKey: "creditBalance",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Kredi Bakiyesi" />
    ),
    cell: ({ row }) => {
      const creditBalance = row.getValue("creditBalance") as number || 0;
      if (creditBalance === 0) {
        return <span className="text-muted-foreground">-</span>;
      }
      return (
        <div className="text-right">
          <Badge variant="outline" className="text-green-600 border-green-600">
            {new Intl.NumberFormat('tr-TR', {
              style: 'currency',
              currency: 'TRY'
            }).format(creditBalance)}
          </Badge>
        </div>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Kayıt Tarihi" />
    ),
    cell: ({ row }) => {
      const createdAt = row.getValue("createdAt") as string;
      return (
        <span className="text-sm">
          {format(new Date(createdAt), "dd MMM yyyy", { locale: tr })}
        </span>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => <DataTableRowActions row={row} />,
  },
]
