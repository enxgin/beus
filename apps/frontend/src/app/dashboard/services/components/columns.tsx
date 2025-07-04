"use client";

import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
      cell: ({ row }) => {
        const service = row.original;

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
                <Link href={`/dashboard/services/${service.id}`}>Görüntüle</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href={`/dashboard/services/${service.id}/edit`}>Düzenle</Link>
              </DropdownMenuItem>
              <DropdownMenuItem>Sil</DropdownMenuItem> 
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
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
