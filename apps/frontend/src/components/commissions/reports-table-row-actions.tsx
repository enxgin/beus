"use client";

import { Row } from "@tanstack/react-table";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MoreHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/components/ui/use-toast";
import { Commission, updateCommissionStatus } from "@/services/commission.service";

interface DataTableRowActionsProps<TData> {
  row: Row<TData>;
}

export function ReportsTableRowActions<TData extends { id: string; status: Commission['status'] }>({ row }: DataTableRowActionsProps<TData>) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const commission = row.original;

  const mutation = useMutation({
    mutationFn: updateCommissionStatus,
    onSuccess: (data) => {
      toast({
        title: "Başarılı",
        description: `Prim durumu başarıyla '${data.status}' olarak güncellendi.`,
      });
      queryClient.invalidateQueries({ queryKey: ["commissions"] });
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.response?.data?.message || "Bir hata oluştu.",
        variant: "destructive",
      });
    },
  });

  const handleStatusChange = (status: Commission['status']) => {
    mutation.mutate({ id: commission.id, status });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Menüyü aç</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Eylemler</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={commission.status === 'APPROVED' || mutation.isPending}
          onClick={() => handleStatusChange('APPROVED')}
        >
          Onayla
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={commission.status === 'PAID' || commission.status !== 'APPROVED' || mutation.isPending}
          onClick={() => handleStatusChange('PAID')}
        >
          Ödendi İşaretle
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={commission.status === 'CANCELED' || mutation.isPending}
          onClick={() => handleStatusChange('CANCELED')}
        >
          İptal Et
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
