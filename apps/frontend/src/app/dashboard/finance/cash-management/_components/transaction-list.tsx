import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { formatCurrency, cn } from '@/lib/utils';
import { 
  ArrowDown, 
  ArrowUp, 
  BookOpen, 
  Lock, 
  Unlock, 
  Edit, 
  Receipt
} from 'lucide-react';

// Bu tip, backend'den gelen CashRegisterLog modeliyle eşleşmelidir.
// Şimdilik genişletilmiş bir yer tutucu kullanıyoruz.
export type Transaction = {
  id: string;
  type: string; // CashLogType enum
  amount: number;
  description: string;
  createdAt: string;
  User: { name: string | null } | null;
};

interface TransactionListProps {
  transactions: Transaction[];
}

const transactionTypeDetails: { [key: string]: { icon: React.ElementType; color: string; label: string } } = {
  OPENING: { icon: Unlock, color: 'text-blue-500 bg-blue-100', label: 'Kasa Açılışı' },
  CLOSING: { icon: Lock, color: 'text-gray-500 bg-gray-100', label: 'Kasa Kapanışı' },
  INCOME: { icon: ArrowUp, color: 'text-green-500 bg-green-100', label: 'Gelir' },
  OUTCOME: { icon: ArrowDown, color: 'text-red-500 bg-red-100', label: 'Gider' },
  MANUAL_IN: { icon: ArrowUp, color: 'text-emerald-500 bg-emerald-100', label: 'Manuel Gelir' },
  MANUAL_OUT: { icon: ArrowDown, color: 'text-orange-500 bg-orange-100', label: 'Manuel Gider' },
  INVOICE_PAYMENT: { icon: Receipt, color: 'text-indigo-500 bg-indigo-100', label: 'Fatura Ödemesi' },
  default: { icon: Edit, color: 'text-yellow-500 bg-yellow-100', label: 'Diğer' },
};

export function TransactionList({ transactions }: TransactionListProps) {
  let runningBalance = 0;

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Günlük Kasa Hareketleri</CardTitle>
          <span className="text-sm text-muted-foreground">
            {format(new Date(), 'dd MMMM yyyy', { locale: tr })}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <div className="flex items-center justify-center h-40">
            <p className="text-muted-foreground">Bugün hiç hareket olmadı.</p>
          </div>
        ) : (
          <ul className="-mx-6 -my-6 divide-y">
            {transactions.map((transaction) => {
              const details = transactionTypeDetails[transaction.type] || transactionTypeDetails.default;
              const Icon = details.icon;
              const isIncome = ['OPENING', 'INCOME', 'MANUAL_IN', 'INVOICE_PAYMENT'].includes(transaction.type);
              
              if (isIncome) {
                runningBalance += transaction.amount;
              } else {
                runningBalance -= transaction.amount;
              }

              return (
                <li key={transaction.id} className="flex items-center justify-between px-6 py-4">
                  <div className="flex items-center">
                    <Avatar className={cn('h-10 w-10', details.color)}>
                      <AvatarFallback className="bg-transparent">
                        <Icon className="h-5 w-5" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-foreground">{transaction.description || details.label}</p>
                      <p className="text-sm text-muted-foreground">
                        {transaction.User?.name || 'Sistem'} • {format(new Date(transaction.createdAt), 'HH:mm')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={cn('text-sm font-semibold', isIncome ? 'text-green-600' : 'text-red-600')}>
                      {isIncome ? '+' : '-'} {formatCurrency(transaction.amount)}
                    </p>
                    <p className="text-xs text-muted-foreground">Bakiye: {formatCurrency(runningBalance)}</p>
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
