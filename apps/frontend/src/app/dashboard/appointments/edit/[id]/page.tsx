'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { EditAppointmentForm } from './components/edit-appointment-form';

// Randevu veri tipini tanımlayalım
interface Appointment {
  id: string;
  startTime: string;
  endTime: string;
  status: string;
  notes: string | null;
  customer: { id: string; name: string; };
  staff: { id: string; name: string; role: any; };
  service: { id: string; name: string; duration: number; price: number; };
  branchId: string;
}

export default function EditAppointmentPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const id = params.id as string;

  const { data: appointment, isLoading, isError, error } = useQuery<Appointment, Error>({
    queryKey: ['appointment', id],
    queryFn: async () => {
      const response = await api.get(`/appointments/${id}`);
      return response.data;
    },
    enabled: !!id,
  });

  useEffect(() => {
    if (isError) {
      toast({
        title: "Hata",
        description: `Randevu bilgileri alınamadı. Lütfen tekrar deneyin.`,
        variant: "destructive",
      });
      router.push('/dashboard/appointments/calendar');
    }
  }, [isError, router, toast]);

  const handleGoBack = () => {
    router.push('/dashboard/appointments/calendar');
  };

  return (
    <div className="container px-4 md:px-6 py-4 md:py-6">
      <div className="flex flex-col space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Button variant="ghost" onClick={handleGoBack} className="mb-2 pl-0">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Takvime Dön
            </Button>
            <h1 className="text-2xl font-bold">Randevu Düzenle</h1>
            <p className="text-muted-foreground">Mevcut randevu bilgilerini güncelleyin.</p>
          </div>
        </div>
        
        <Separator />
        
        <div className="py-4">
          {isLoading && (
            <div className="space-y-4">
              <Skeleton className="h-8 w-1/4" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-8 w-1/4" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-8 w-1/4" />
              <Skeleton className="h-20 w-full" />
            </div>
          )}
          {appointment && (
            <EditAppointmentForm appointment={appointment} />
          )}
        </div>
      </div>
    </div>
  );
}
