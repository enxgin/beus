'use client';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
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
  Loader2,
  HomeIcon
} from 'lucide-react';
import { useState, useEffect } from 'react';

import { getCashDayDetails } from '@/actions/cash-register-actions';
import { useAuthStore } from '@/stores/auth.store';
import { AddCashMovementModal } from '@/components/dashboard/finance/AddCashMovementModal';
import { OpenCashDayDialog } from './_components/open-cash-day-dialog';
import { QuickActions } from './_components/quick-actions';
import { StatCard } from './_components/stat-card';
import { TransactionList } from './_components/transaction-list';

export default function CashManagementPage() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [isOpeningDialogOpen, setIsOpeningDialogOpen] = useState(false);
  const { user, token } = useAuthStore();
  const branchId = user?.branchId;
  
  // Token durumunu kontrol etmek için
  useEffect(() => {
    console.log('Auth Store Token Durumu:', token ? 'Token var' : 'Token yok');
  }, [token]);
  const formattedDate = date ? format(date, 'yyyy-MM-dd') : '';

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['cash-day-details', formattedDate, branchId],
    queryFn: () => getCashDayDetails(token, formattedDate, branchId!),
    enabled: !!formattedDate && !!branchId && !!token,
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

  const { 
    status = 'CLOSED', 
    currentBalance = 0, 
    dailyIncome = 0, 
    dailyOutcome = 0, 
    netChange = 0, 
    transactions = [], 
    openingBalance = 0 
  } = data || {};

  return (
    <div className="space-y-6">
      <div>
        <Breadcrumb>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard">
              <HomeIcon className="h-4 w-4" />
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard/finance">Finans</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem isCurrentPage>
            <BreadcrumbLink>Kasa Yönetimi</BreadcrumbLink>
          </BreadcrumbItem>
        </Breadcrumb>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-2">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Kasa Yönetimi</h1>
            <p className="text-muted-foreground mt-1">
              Günlük kasa hareketlerini takip edin ve yönetin.
            </p>
          </div>
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
            <AddCashMovementModal />
            <Button onClick={() => setIsOpeningDialogOpen(true)} disabled={status === 'OPEN'}>
              <PlusCircle className="mr-2 h-4 w-4" /> Kasa Aç
            </Button>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
          <TransactionList transactions={transactions || []} openingBalance={openingBalance || 0} />
        </div>
        <div className="space-y-6">
          {/* TODO: Ödeme Özeti Kartı Eklenecek */}
          <QuickActions />
        </div>
      </div>

      {branchId && (
        <OpenCashDayDialog
          isOpen={isOpeningDialogOpen}
          onClose={() => setIsOpeningDialogOpen(false)}
          branchId={branchId}
        />
      )}
    </div>
  );
}
