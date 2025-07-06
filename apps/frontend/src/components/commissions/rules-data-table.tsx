"use client";

import * as React from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DataTablePagination } from "@/components/ui/data-table/data-table-pagination";
import { Button } from "@/components/ui/button";
import { CommissionRuleForm } from "./commission-rule-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CommissionRule } from "@/services/commission.service";
import { columns as baseColumns } from "@/components/commissions/rules-columns";
import { DataTableRowActions } from "./rules-table-row-actions";

interface DataTableProps<TData, TValue> {
  data: TData[];
  pageCount: number;
}

export function RulesDataTable<TData extends { id: string }, TValue>({
  data,
  pageCount,
}: DataTableProps<TData, TValue>) {
  const [isDialogOpen, setDialogOpen] = React.useState(false);
  const [selectedRule, setSelectedRule] = React.useState<CommissionRule | null>(
    null
  );

  const handleOpenDialog = (rule: CommissionRule | null = null) => {
    setSelectedRule(rule);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedRule(null);
  };

  const columns = React.useMemo<ColumnDef<TData, TValue>[]>(
    () => [
      ...(baseColumns as ColumnDef<TData, TValue>[]),
      {
        id: "actions",
        cell: ({ row }) => (
          <DataTableRowActions
            row={row}
            onEdit={() =>
              handleOpenDialog(row.original as unknown as CommissionRule)
            }
          />
        ),
      },
    ],
    [handleOpenDialog]
  );

  const table = useReactTable({
    data,
    columns,
    pageCount,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true,
  });

  return (
    <div className="space-y-4">
      <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight">Prim Kuralları</h2>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>Yeni Kural Ekle</Button>
          </DialogTrigger>
        </div>
        <DialogContent className="sm:max-w-[625px]">
          <DialogHeader>
            <DialogTitle>
              {selectedRule ? "Kuralı Düzenle" : "Yeni Kural Oluştur"}
            </DialogTitle>
            <DialogDescription>
              {
                selectedRule
                  ? "Mevcut prim kuralını güncelleyin."
                  : "Yeni bir prim kuralı oluşturun."
              }
            </DialogDescription>
          </DialogHeader>
          <CommissionRuleForm
            initialData={selectedRule}
            onSuccess={handleCloseDialog}
          />
        </DialogContent>
      </Dialog>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  Sonuç bulunamadı.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination table={table} />
    </div>
  );
}
