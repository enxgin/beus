'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { formatCurrency, cn } from '@/lib/utils';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Landmark,
  DoorOpen,
  DoorClosed,
  User as UserIcon,
} from 'lucide-react';

// Prisma'dan gelen tipe benzer bir tip tanımı
interface Transaction {
  id: string;
  type: string; // CashLogType enum: OPENING, CLOSING, INCOME, OUTCOME, MANUAL_IN, MANUAL_OUT, etc.
  amount: number;
  description: string | null;
  createdAt: string;
  User?: {
    name: string | null;
  } | null;
}

interface TransactionListProps {
  transactions: Transaction[];
  openingBalance: number;
}

const getTransactionIcon = (type: string) => {
  switch (type) {
    case 'INCOME':
    case 'MANUAL_IN':
    case 'INVOICE_PAYMENT':
      return <ArrowUpRight className="h-5 w-5 text-green-500" />;
    case 'OUTCOME':
    case 'MANUAL_OUT':
      return <ArrowDownLeft className="h-5 w-5 text-red-500" />;
    case 'OPENING':
      return <DoorOpen className="h-5 w-5 text-blue-500" />;
    case 'CLOSING':
      return <DoorClosed className="h-5 w-5 text-gray-500" />;
    default:
      return <Landmark className="h-5 w-5 text-gray-400" />;
  }
};

const getTransactionTitle = (type: string, description: string | null) => {
  if (description) return description;
  switch (type) {
    case 'OPENING': return 'Kasa Açılışı';
    case 'CLOSING': return 'Kasa Kapanışı';
    case 'INCOME': return 'Nakit Gelir';
    case 'OUTCOME': return 'Nakit Gider';
    case 'MANUAL_IN': return 'Manuel Gelir';
    case 'MANUAL_OUT': return 'Manuel Gider';
    case 'INVOICE_PAYMENT': return 'Fatura Ödemesi';
    default: return 'Diğer İşlem';
  }
};

export function TransactionList({ transactions = [], openingBalance = 0 }: TransactionListProps) {
  let runningBalance = openingBalance;

  const isIncome = (type: string) => ['INCOME', 'MANUAL_IN', 'INVOICE_PAYMENT'].includes(type);
  const isOutcome = (type: string) => ['OUTCOME', 'MANUAL_OUT'].includes(type);

  const financialTransactions = transactions.filter(t => isIncome(t.type) || isOutcome(t.type));

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Günlük Hareketler</CardTitle>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <div className="text-center text-gray-500 py-8">Bugün için işlem bulunmuyor.</div>
        ) : (
          <ul className="space-y-4">
            {transactions.map((transaction, index) => {
              // Kasa açılışı gelire, kapanışı gidere dahil edilmez, bunlar özel durumlardır.
              if (isIncome(transaction.type)) {
                runningBalance += transaction.amount;
              } else if (isOutcome(transaction.type)) {
                runningBalance -= transaction.amount;
              }

              const isFinancialMovement = isIncome(transaction.type) || isOutcome(transaction.type);

              return (
                <li key={transaction.id} className="flex items-center space-x-4">
                  <Avatar className="h-10 w-10 border">
                    <AvatarFallback className="bg-transparent">
                      {getTransactionIcon(transaction.type)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium">{getTransactionTitle(transaction.type, transaction.description)}</p>
                    <p className="text-sm text-gray-500">
                      {transaction.User?.name || 'Sistem'} - {new Date(transaction.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={cn('font-semibold', {
                      'text-green-600': isIncome(transaction.type),
                      'text-red-600': isOutcome(transaction.type),
                      'text-blue-600': transaction.type === 'OPENING',
                      'text-gray-600': transaction.type === 'CLOSING',
                    })}>
                      {isIncome(transaction.type) ? '+' : isOutcome(transaction.type) ? '-' : ''}{formatCurrency(transaction.amount)}
                    </p>
                    {isFinancialMovement && <p className="text-sm text-gray-500">{formatCurrency(runningBalance)}</p>}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
