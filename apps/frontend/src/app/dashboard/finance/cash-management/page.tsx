'use client';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { formatCurrency, cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { 
  Calendar as CalendarIcon, 
  PlusCircle, 
  Wallet, 
  ArrowUp, 
  ArrowDown, 
  Plus, 
  Minus, 
  Loader2 
} from 'lucide-react';
import { useState } from 'react';

import { getCashDayDetails } from '@/actions/cash-register-actions';
import { OpenCashDayDialog } from './_components/open-cash-day-dialog';
import { QuickActions } from './_components/quick-actions';
import { StatCard } from './_components/stat-card';
import { TransactionList } from './_components/transaction-list';

export default function CashManagementPage() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [isOpeningDialogOpen, setIsOpeningDialogOpen] = useState(false);

  // TODO: branchId'yi kullanıcı session'ından al
  const branchId = 'clxyj6eax000013sq918l3vsd';
  const formattedDate = date ? format(date, 'yyyy-MM-dd') : '';

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['cash-day-details', formattedDate, branchId],
    queryFn: () => getCashDayDetails(formattedDate, branchId),
    enabled: !!formattedDate && !!branchId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError) {
    return <div className="text-center text-red-500">Hata: {error.message}</div>;
  }

  const { status, currentBalance, dailyIncome, dailyOutcome, netChange, transactions } = data || {};

  return (
    <>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Kasa Yönetimi</h1>
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={'outline'}
                className={cn(
                  'w-[240px] justify-start text-left font-normal',
                  !date && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, 'PPP', { locale: tr }) : <span>Tarih seçin</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
            </PopoverContent>
          </Popover>
          <Button onClick={() => setIsOpeningDialogOpen(true)} disabled={status === 'OPEN'}>
            <PlusCircle className="mr-2 h-4 w-4" /> Kasa Aç
          </Button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <StatCard 
          title="Güncel Bakiye" 
          value={formatCurrency(currentBalance)} 
          subtitle={status === 'OPEN' ? 'Kasa Açık' : 'Kasa Kapalı'}
          icon={Wallet}
          iconColor={status === 'OPEN' ? 'text-green-500' : 'text-red-500'}
        />
        <StatCard 
          title="Günlük Gelir" 
          value={formatCurrency(dailyIncome)} 
          icon={ArrowUp}
          iconColor='text-green-500'
        />
        <StatCard 
          title="Günlük Gider" 
          value={formatCurrency(dailyOutcome)} 
          icon={ArrowDown}
          iconColor='text-red-500'
        />
        <StatCard 
          title="Net Değişim" 
          value={formatCurrency(netChange)} 
          icon={netChange >= 0 ? Plus : Minus}
          iconColor={netChange >= 0 ? 'text-green-500' : 'text-red-500'}
        />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <TransactionList transactions={transactions || []} />
        </div>
        <div className="space-y-6">
          {/* TODO: Ödeme Özeti Kartı Eklenecek */}
          <QuickActions />
        </div>
      </div>

      <OpenCashDayDialog
        isOpen={isOpeningDialogOpen}
        onClose={() => setIsOpeningDialogOpen(false)}
      />
    </>
  );
}
