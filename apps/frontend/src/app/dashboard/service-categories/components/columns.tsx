"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { ServiceCategory } from "../data/schema"
import { DataTableColumnHeader } from "./data-table-column-header"
import { DataTableRowActions } from "./data-table-row-actions"
import { format } from "date-fns"
import { tr } from "date-fns/locale"

type UserRole = 'ADMIN' | 'SUPER_BRANCH_MANAGER' | 'BRANCH_MANAGER' | 'STAFF' | string

export const getColumns = (userRole?: UserRole): ColumnDef<ServiceCategory>[] => {
  // Şube sütununu sadece admin ve süper şube yöneticileri görebilir
  const canViewBranch = userRole === 'ADMIN' || userRole === 'SUPER_BRANCH_MANAGER'
  
  const columns: ColumnDef<ServiceCategory>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Kategori Adı" />
      ),
      cell: ({ row }) => <div className="font-medium">{row.getValue("name")}</div>,
      enableSorting: true,
    },
    {
      accessorKey: "description",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Açıklama" />
      ),
      cell: ({ row }) => {
        const description = row.getValue("description") as string
        return (
          <div className="max-w-[300px] truncate">
            {description || <span className="text-muted-foreground text-xs">Açıklama yok</span>}
          </div>
        )
      },
    },
  ]
  
  // Sadece admin ve süper yönetici için şube sütunu ekle
  if (canViewBranch) {
    columns.push({
      accessorKey: "branch",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Şube" />
      ),
      cell: ({ row }) => {
        const branch = row.original.branch
        return (
          <div>
            {branch ? branch.name : 
              <span className="text-muted-foreground text-xs">Genel</span>
            }
          </div>
        )
      },
    })
  }
  
  // Diğer sütunları ekle
  columns.push(
    {
      accessorKey: "isActive",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Durum" />
      ),
      cell: ({ row }) => {
        const isActive = row.getValue("isActive") as boolean
        return (
          <Badge variant={isActive ? "success" : "destructive"}>
            {isActive ? "Aktif" : "Pasif"}
          </Badge>
        )
      },
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id))
      },
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Oluşturulma Tarihi" />
      ),
      cell: ({ row }) => {
        const date = new Date(row.getValue("createdAt"))
        return <div>{format(date, "dd MMMM yyyy", { locale: tr })}</div>
      },
    },
    {
      id: "actions",
      cell: ({ row }) => <DataTableRowActions row={row} />,
    }
  )
  
  return columns
}
