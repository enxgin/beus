"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { DataTableColumnHeader } from "./data-table-column-header"
import { DataTableRowActions } from "./data-table-row-actions"
import { Customer, Tag } from "@prisma/client"

export type CustomerWithTags = Customer & {
  tags: Tag[]
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
    id: "actions",
    cell: ({ row }) => <DataTableRowActions row={row} />,
  },
]
