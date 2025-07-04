"use client"

"use client"

import { ColumnDef } from "@tanstack/react-table"
import { CellAction } from "./cell-action"

// Bu tip, backend'den gelen Prisma modeline göre oluşturulmuştur.
export type Branch = {
  id: string
  name: string
  address: string | null
  phone: string | null
  description: string | null
  createdAt: string
  parentBranchId: string | null
  parentBranch?: {
    name: string
  } | null
  // Gerekirse alt şubeleri de ekleyebilirsiniz
  // _count?: { childrenBranches: number } | null
}

export const columns: ColumnDef<Branch>[] = [
  {
    accessorKey: "name",
    header: "Şube Adı",
    cell: ({ row }) => {
      const branch = row.original
      // Eğer bir üst şubesi varsa, hiyerarşik olarak göster
      if (branch.parentBranch) {
        return (
          <div className="font-medium">{`${branch.parentBranch.name} > ${branch.name}`}</div>
        )
      }
      return <div className="font-bold">{branch.name}</div>
    },
  },
  {
    accessorKey: "address",
    header: "Adres",
  },
  {
    accessorKey: "phone",
    header: "Telefon",
  },
  {
    accessorKey: "createdAt",
    header: "Oluşturulma Tarihi",
    cell: ({ row }) => {
      const date = new Date(row.getValue("createdAt"))
      return <div className="font-medium">{date.toLocaleDateString('tr-TR')}</div>
    },
  },
  {
    id: "actions",
    header: "İşlemler",
    cell: ({ row }) => <CellAction data={row.original} />,
  },
]
