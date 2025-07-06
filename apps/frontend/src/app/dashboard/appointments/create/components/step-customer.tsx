'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Customer } from '@/lib/prisma-client';
import { AppointmentFormData } from './appointment-wizard';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useDebounce } from '@/hooks/use-debounce';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from '@/components/ui/use-toast';
import { useMutation } from '@tanstack/react-query';

interface StepCustomerProps {
  formData: AppointmentFormData;
  onSelectCustomer: (customer: Customer) => void;
}

async function searchCustomers(query: string, branchId?: string): Promise<Customer[]> {
  if (!query || query.length < 2) return [];
  const { data } = await api.get('/customers/search', { 
    params: { 
      name: query, // Backend 'name' parametresi bekliyor, 'query' değil
      branchId: branchId || '' // branchId null/undefined ise boş string gönder
    } 
  });
  return data;
}

// Form validation schema for new customer
const newCustomerSchema = z.object({
  name: z.string().min(2, { message: 'Müşteri adı en az 2 karakter olmalıdır' }),
  email: z.string().email({ message: 'Geçerli bir e-posta adresi giriniz' }).optional().or(z.literal('')),
  phone: z.string().min(10, { message: 'Telefon numarası en az 10 karakter olmalıdır' }),
});

type NewCustomerFormValues = z.infer<typeof newCustomerSchema>;

// Function to create a new customer
async function createCustomer(customerData: NewCustomerFormValues): Promise<Customer> {
  const { data } = await api.post('/customers', customerData);
  return data;
}

export function StepCustomer({ formData, onSelectCustomer }: StepCustomerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const [isNewCustomerDialogOpen, setIsNewCustomerDialogOpen] = useState(false);
  
  // Form for new customer creation
  const form = useForm<NewCustomerFormValues>({
    resolver: zodResolver(newCustomerSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
    },
  });

  // Query for customer search
  const { data: customers, isLoading } = useQuery<Customer[]>({ 
    queryKey: ['customer-search', debouncedSearchQuery, formData.branchId],
    queryFn: () => searchCustomers(debouncedSearchQuery, formData.branchId),
    enabled: debouncedSearchQuery.length >= 2,
  });

  // Mutation for creating new customer
  const createCustomerMutation = useMutation({
    mutationFn: createCustomer,
    onSuccess: (newCustomer) => {
      toast({
        title: 'Başarılı',
        description: 'Yeni müşteri başarıyla oluşturuldu',
        variant: 'default',
      });
      setIsNewCustomerDialogOpen(false);
      form.reset();
      onSelectCustomer(newCustomer);
    },
    onError: (error) => {
      toast({
        title: 'Hata',
        description: 'Müşteri oluşturulurken bir hata oluştu',
        variant: 'destructive',
      });
      console.error('Customer creation error:', error);
    },
  });

  // Handle new customer form submission
  const onSubmit = (values: NewCustomerFormValues) => {
    createCustomerMutation.mutate(values);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold">Müşteri Seçimi</h2>
          <p className="text-sm text-muted-foreground">Randevu oluşturmak istediğiniz müşteriyi seçin veya yeni bir müşteri oluşturun</p>
        </div>
        <Button onClick={() => setIsNewCustomerDialogOpen(true)}>
          <i className="fas fa-plus mr-2"></i> Yeni Müşteri
        </Button>
      </div>
      
      {/* Müşteri arama */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <i className="fas fa-search text-gray-400"></i>
        </div>
        <Input
          className="pl-10"
          placeholder="Müşteri adı veya telefon numarası ile ara..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      
      {/* Müşteri listesi */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto p-1">
        {isLoading && [
          <Skeleton key="1" className="h-24 w-full" />,
          <Skeleton key="2" className="h-24 w-full" />,
          <Skeleton key="3" className="h-24 w-full" />
        ]}
        
        {customers?.map((customer) => (
          <div
            key={customer.id}
            onClick={() => onSelectCustomer(customer)}
            className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${formData.customer?.id === customer.id ? 'bg-blue-50 border-blue-600 ring-1 ring-blue-600' : 'border-gray-200 hover:border-blue-400'}`}
          >
            <div className="flex items-center gap-4">
              <Avatar className="h-12 w-12 bg-blue-100 text-blue-700">
                <AvatarFallback>{customer.name.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold">{customer.name}</h3>
                <p className="text-sm text-muted-foreground">{customer.phone}</p>
                {customer.email && (
                  <p className="text-xs text-muted-foreground mt-1">{customer.email}</p>
                )}
              </div>
            </div>
          </div>
        ))}
        
        {!isLoading && searchQuery.length >= 2 && customers?.length === 0 && (
          <div className="col-span-full text-center py-8">
            <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
              <i className="fas fa-search text-gray-400 text-lg"></i>
            </div>
            <h3 className="text-lg font-semibold mb-1">Müşteri bulunamadı</h3>
            <p className="text-sm text-muted-foreground mb-4">Yeni bir müşteri oluşturmak için butona tıklayın</p>
            <Button onClick={() => setIsNewCustomerDialogOpen(true)} variant="outline" size="sm">
              <i className="fas fa-plus mr-2"></i> Yeni Müşteri
            </Button>
          </div>
        )}
        
        {!isLoading && searchQuery.length < 2 && (
          <div className="col-span-full text-center py-8">
            <p className="text-sm text-muted-foreground">Müşteri aramak için en az 2 karakter girin</p>
          </div>
        )}
      </div>
      
      {/* Yeni müşteri oluşturma dialog */}
      <Dialog open={isNewCustomerDialogOpen} onOpenChange={setIsNewCustomerDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Yeni Müşteri Oluştur</DialogTitle>
            <DialogDescription>
              Yeni müşteri bilgilerini doldurun ve kaydet butonuna tıklayın.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ad Soyad</FormLabel>
                    <FormControl>
                      <Input placeholder="Müşteri Adı Soyadı" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefon</FormLabel>
                    <FormControl>
                      <Input placeholder="05XX XXX XX XX" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-posta (Opsiyonel)</FormLabel>
                    <FormControl>
                      <Input placeholder="ornek@email.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter className="mt-6">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsNewCustomerDialogOpen(false)}
                >
                  İptal
                </Button>
                <Button 
                  type="submit"
                  disabled={createCustomerMutation.isPending}
                >
                  {createCustomerMutation.isPending ? 'Kaydediliyor...' : 'Kaydet'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
