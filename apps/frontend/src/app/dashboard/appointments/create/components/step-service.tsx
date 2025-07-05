'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api'; // Corrected import
import { Service } from '@/lib/prisma-client';
import { AppointmentFormData } from './appointment-wizard';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface StepServiceProps {
  formData: AppointmentFormData;
  onSelectService: (service: Service) => void;
}

async function fetchServices(branchId?: string): Promise<Service[]> {
  if (!branchId) return [];
  // API artık { data: Service[], totalCount: number } formatında bir nesne döndürüyor
  // ve tüm hizmetleri getirmek için 'take' parametresi gerekiyor.
  const { data } = await api.get('/services', { params: { branchId, take: 1000 } });
  return data.data; // Dönen nesnenin içindeki 'data' dizisini döndür
}

export function StepService({ formData, onSelectService }: StepServiceProps) {
  const { data: services, isLoading } = useQuery<Service[]>({ // Corrected syntax
    queryKey: ['services', formData.branchId],
    queryFn: () => fetchServices(formData.branchId),
    enabled: !!formData.branchId,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Adım 1: Hizmet Seçimi</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {isLoading && Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
          {services?.map((service) => (
            <div
              key={service.id}
              onClick={() => onSelectService(service)}
              className={`p-4 border rounded-lg cursor-pointer transition-all ${
                formData.service?.id === service.id
                  ? 'border-primary ring-2 ring-primary'
                  : 'border-border'
              }`}>
              <h3 className="font-semibold">{service.name}</h3>
              <p className="text-sm text-muted-foreground">{service.duration} dk</p>
              <p className="text-sm font-medium">{service.price} TL</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
