'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Prisma'dan gelen Service tipiyle uyumlu olmalı
interface Service {
  id: string;
  name: string;
  duration: number;
  price: number;
  // Gerekirse diğer alanlar eklenebilir
}

interface EditStepServiceProps {
  branchId: string;
  selectedService: Service | null;
  onSelectService: (service: Service) => void;
}

async function fetchServices(branchId: string): Promise<Service[]> {
  const { data } = await api.get('/services', { params: { branchId } });
  // API'den gelen veri { data: [], totalCount: X } formatında, bu yüzden data.data'yı alıyoruz.
  return data.data;
}

export function EditStepService({ branchId, selectedService, onSelectService }: EditStepServiceProps) {
  const { data: services, isLoading } = useQuery<Service[]>({
    queryKey: ['services', branchId],
    queryFn: () => fetchServices(branchId),
    enabled: !!branchId,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Hizmet Seçimi</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {isLoading && Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
          {services?.map((service) => (
            <div
              key={service.id}
              onClick={() => onSelectService(service)}
              className={`p-4 border rounded-lg cursor-pointer transition-all ${
                selectedService?.id === service.id
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
