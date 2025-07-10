"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import { CellAction } from "./cell-action";
import { PerformanceBadge } from "./performance-badge";

export type UserColumn = {
  id: string;
  name: string;
  email: string;
  role: string;
  branch: string;
};

export type ExtendedUserColumn = UserColumn & {
  monthlyAppointments?: number;
  totalRevenue?: number;
  totalCommissions?: number;
  lastActivity?: string | null;
  performanceScore?: number;
  status?: 'active' | 'inactive';
  isActive?: boolean;
};

const getRoleDisplayName = (role: string) => {
  const roleNames: Record<string, string> = {
    'ADMIN': 'Admin',
    'SUPER_BRANCH_MANAGER': 'Üst Şube Yöneticisi',
    'BRANCH_MANAGER': 'Şube Yöneticisi',
    'RECEPTION': 'Resepsiyon',
    'STAFF': 'Personel',
  };
  return roleNames[role] || role;
};

export const columns: ColumnDef<UserColumn>[] = [
  {
    accessorKey: "name",
    header: "İsim Soyisim",
  },
  {
    accessorKey: "email",
    header: "E-posta",
  },
  {
    accessorKey: "branch",
    header: "Şube",
  },
  {
    accessorKey: "role",
    header: "Rol",
    cell: ({ row }) => getRoleDisplayName(row.original.role),
  },
  {
    id: "actions",
    header: "Eylemler",
    cell: ({ row }) => <CellAction data={row.original} />,
  },
];

export const extendedColumns: ColumnDef<ExtendedUserColumn>[] = [
  {
    accessorKey: "name",
    header: "İsim Soyisim",
  },
  {
    accessorKey: "email",
    header: "E-posta",
  },
  {
    accessorKey: "branch",
    header: "Şube",
    cell: ({ row }) => row.original.branch || 'Atanmamış',
  },
  {
    accessorKey: "role",
    header: "Rol",
    cell: ({ row }) => getRoleDisplayName(row.original.role),
  },
  {
    accessorKey: "monthlyAppointments",
    header: "Bu Ay Randevu",
    cell: ({ row }) => (
      <Badge variant="secondary" className="text-xs">
        {row.original.monthlyAppointments || 0}
      </Badge>
    ),
  },
  {
    accessorKey: "totalRevenue",
    header: "Toplam Gelir",
    cell: ({ row }) => (
      <span className="font-medium text-green-600">
        ₺{(row.original.totalRevenue || 0).toLocaleString('tr-TR')}
      </span>
    ),
  },
  {
    accessorKey: "totalCommissions",
    header: "Prim Tutarı",
    cell: ({ row }) => (
      <span className="font-medium text-blue-600">
        ₺{(row.original.totalCommissions || 0).toLocaleString('tr-TR')}
      </span>
    ),
  },
  {
    accessorKey: "performanceScore",
    header: "Performans",
    cell: ({ row }) => (
      <PerformanceBadge score={row.original.performanceScore || 0} />
    ),
  },
  {
    accessorKey: "lastActivity",
    header: "Son Aktivite",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {row.original.lastActivity
          ? formatDistanceToNow(new Date(row.original.lastActivity), {
              addSuffix: true,
              locale: tr
            })
          : 'Hiç'
        }
      </span>
    ),
  },
  {
    accessorKey: "isActive",
    header: "Durum",
    cell: ({ row }) => (
      <Badge
        variant={row.original.isActive ? 'default' : 'secondary'}
        className="text-xs"
      >
        {row.original.isActive ? 'Aktif' : 'Pasif'}
      </Badge>
    ),
  },
  {
    id: "actions",
    header: "Eylemler",
    cell: ({ row }) => <CellAction data={row.original} />,
  },
];
