import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { 
  ArrowRight, 
  Plus, 
  History, 
  BarChart3, 
  CreditCard 
} from 'lucide-react';

const actions = [
  {
    href: '/dashboard/finance/cash-management/add-movement', // Bu yolu daha sonra oluşturabiliriz
    label: 'Manuel Hareket Ekle',
    icon: Plus,
    color: 'text-blue-600',
  },
  {
    href: '/dashboard/finance/cash-management/history', // Bu yolu daha sonra oluşturabiliriz
    label: 'Hareket Geçmişi',
    icon: History,
    color: 'text-gray-600',
  },
  {
    href: '/dashboard/reports/cash-reports', // Raporlar sayfası varsayımı
    label: 'Kasa Raporları',
    icon: BarChart3,
    color: 'text-green-600',
  },
  {
    href: '/dashboard/finance/invoices', // Fatura sayfası varsayımı
    label: 'Ödeme Yönetimi',
    icon: CreditCard,
    color: 'text-purple-600',
  },
];

export function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Hızlı İşlemler</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {actions.map((action) => (
            <li key={action.href}>
              <Link href={action.href}>
                <div className="flex items-center p-2 rounded-md hover:bg-muted transition-colors">
                  <action.icon className={`mr-3 h-5 w-5 ${action.color}`} />
                  <span className="flex-1 text-sm font-medium">{action.label}</span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
