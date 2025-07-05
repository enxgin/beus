'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Customer } from '@/lib/prisma-client';
import { AppointmentFormData } from './appointment-wizard';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useDebounce } from '@/hooks/use-debounce';

interface StepCustomerProps {
  formData: AppointmentFormData;
  onSelectCustomer: (customer: Customer) => void;
}

async function searchCustomers(query: string): Promise<Customer[]> {
  if (!query || query.length < 2) return [];
  const { data } = await api.get('/customers/search', { params: { query } });
  return data;
}

export function StepCustomer({ formData, onSelectCustomer }: StepCustomerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  const { data: customers, isLoading } = useQuery<Customer[]>({ 
    queryKey: ['customer-search', debouncedSearchQuery],
    queryFn: () => searchCustomers(debouncedSearchQuery),
    enabled: debouncedSearchQuery.length >= 2,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Adım 4: Müşteri Seçimi</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          <Input
            placeholder="Müşteri adı veya telefon numarası ile ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className="flex flex-col gap-2 h-64 overflow-y-auto pr-2">
            {isLoading && <Skeleton className="h-16 w-full" />}
            {customers?.map((customer) => (
              <div
                key={customer.id}
                onClick={() => onSelectCustomer(customer)}
                className={`p-3 border rounded-lg cursor-pointer transition-all flex items-center gap-4 ${
                  formData.customer?.id === customer.id
                    ? 'border-primary ring-2 ring-primary'
                    : 'border-border'
                }`}>
                <Avatar>
                  {/* Hata düzeltildi: image alanı kaldırıldı */}
                  <AvatarFallback>{customer.name.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold">{customer.name}</h3>
                  <p className="text-sm text-muted-foreground">{customer.phone}</p>
                </div>
              </div>
            ))}
            {!isLoading && customers?.length === 0 && debouncedSearchQuery.length >= 2 && (
                <p className="text-center text-muted-foreground pt-4">Müşteri bulunamadı.</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
