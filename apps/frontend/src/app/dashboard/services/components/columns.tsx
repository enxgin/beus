"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTableRowActions } from "./data-table-row-actions";
import { Service } from "@/types/service"; // Bu tipi daha sonra oluşturacağız
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useAuthStore } from "@/stores/auth.store";
import { UserRole } from "@/types/user";

export const getColumns = (userRole: UserRole | null): ColumnDef<Service>[] => {
  const columns: ColumnDef<Service>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Hizmet Adı
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
    },
    {
      accessorKey: "category.name",
      header: "Kategori",
    },
    {
      accessorKey: "duration",
      header: "Süre (dk)",
    },
    {
      accessorKey: "price",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Fiyat (₺)
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const amount = parseFloat(row.getValue("price"));
        const formatted = new Intl.NumberFormat("tr-TR", {
          style: "currency",
          currency: "TRY",
        }).format(amount);

        return <div className="font-medium">{formatted}</div>;
      },
    },
    {
      accessorKey: "isActive",
      header: "Durum",
      cell: ({ row }) => {
        const isActive = row.getValue("isActive");
        return (
          <Badge variant={isActive ? "default" : "destructive"}>
            {isActive ? "Aktif" : "Pasif"}
          </Badge>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: "Oluşturulma Tarihi",
      cell: ({ row }) => {
        const date = new Date(row.getValue("createdAt"));
        return date.toLocaleDateString("tr-TR");
      },
    },
    {
      id: "actions",
      cell: ({ row }) => <DataTableRowActions row={row} />,
    },
  ];

  if (userRole === UserRole.ADMIN || userRole === UserRole.SUPER_BRANCH_MANAGER) {
    columns.splice(3, 0, {
      accessorKey: "branch.name",
      header: "Şube",
    });
  }

  return columns;
};
