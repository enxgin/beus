'use client';

import { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, MoreHorizontal } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/utils';

// Bu tip, backend'den gelen veri yapısıyla eşleşmelidir.
// Şimdilik bir yer tutucu olarak kullanıyoruz.
export type CashReport = {
  id: string;
  date: string;
  status: 'OPEN' | 'CLOSED';
  openingBalance: number | null;
  expectedBalance: number | null;
  actualBalance: number | null;
  difference: number | null;
  openedByUser: { name: string | null } | null;
  closedByUser: { name: string | null } | null;
};

export const columns: ColumnDef<CashReport>[] = [
  {
    accessorKey: 'date',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Tarih
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => format(new Date(row.getValue('date')), 'dd.MM.yyyy HH:mm'),
  },
  {
    accessorKey: 'status',
    header: 'Durum',
    cell: ({ row }) => {
      const status = row.getValue('status') as string;
      const variant = status === 'CLOSED' ? 'destructive' : 'default';
      const text = status === 'CLOSED' ? 'Kapalı' : 'Açık';
      return <Badge variant={variant}>{text}</Badge>;
    },
  },
  {
    accessorKey: 'openingBalance',
    header: () => <div className="text-right">Açılış Bakiyesi</div>,
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue('openingBalance'));
      return <div className="text-right font-medium">{formatCurrency(amount)}</div>;
    },
  },
  {
    accessorKey: 'expectedBalance',
    header: () => <div className="text-right">Beklenen Bakiye</div>,
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue('expectedBalance'));
      return <div className="text-right font-medium">{formatCurrency(amount)}</div>;
    },
  },
    {
    accessorKey: 'actualBalance',
    header: () => <div className="text-right">Gerçek Bakiye</div>,
    cell: ({ row }) => {
      const amount = row.getValue('actualBalance') ? parseFloat(row.getValue('actualBalance')) : null;
      return <div className="text-right font-medium">{amount ? formatCurrency(amount) : '-'}</div>;
    },
  },
  {
    accessorKey: 'difference',
    header: () => <div className="text-right">Fark</div>,
    cell: ({ row }) => {
      const amount = row.getValue('difference') ? parseFloat(row.getValue('difference')) : null;
      const isNegative = amount !== null && amount < 0;
      return (
        <div className={`text-right font-medium ${isNegative ? 'text-red-500' : 'text-green-500'}`}>
          {amount ? formatCurrency(amount) : '-'}
        </div>
      );
    },
  },
  {
    accessorKey: 'openedByUser.name',
    header: 'Açan Kullanıcı',
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const report = row.original;
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
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(report.id)}
            >
              Gün ID'sini Kopyala
            </DropdownMenuItem>
            <DropdownMenuItem>Gün Detaylarını Görüntüle</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
