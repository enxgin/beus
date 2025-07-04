"use client";

import { ColumnDef } from "@tanstack/react-table";
import { CellAction } from "./cell-action";

export type UserColumn = {
  id: string;
  name: string;
  email: string;
  role: string;
  branch: string;
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
  },
  {
    id: "actions",
    header: "Eylemler",
    cell: ({ row }) => <CellAction data={row.original} />,
  },
];
