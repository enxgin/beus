'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AppointmentWizard } from './components/appointment-wizard';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';

export default function CreateAppointmentPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  
  // URL parametrelerini al
  const branchId = searchParams.get('branchId') || undefined;
  
  // Takvimden gelen start parametresini kontrol et
  const startParam = searchParams.get('start');
  let selectedDate = searchParams.get('date') || undefined;
  let startTime = searchParams.get('time') || undefined;
  
  // Eğer takvimden start parametresi geldiyse, tarih ve saat bilgisini ayır
  if (startParam) {
    console.log('Takvimden gelen start parametresi:', startParam);
    try {
      const startDate = new Date(startParam);
      selectedDate = startDate.toISOString().split('T')[0]; // YYYY-MM-DD formatı
      startTime = startDate.toTimeString().split(' ')[0].substring(0, 5); // HH:MM formatı
      console.log('Ayrıştırılan tarih:', selectedDate, 'saat:', startTime);
    } catch (error) {
      console.error('Start parametresi ayrıştırılamadı:', error);
    }
  }
  
  const selectedStaffId = searchParams.get('staffId') || undefined;
  
  // Şube ID'si zorunlu, kontrol et
  useEffect(() => {
    if (!branchId) {
      toast({
        title: "Uyarı",
        description: "Randevu oluşturmak için şube seçilmelidir",
        variant: "destructive",
      });
      router.push('/dashboard/appointments/calendar');
    }
  }, [branchId, router, toast]);

  // Takvim sayfasına dön
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
            <h1 className="text-2xl font-bold">Yeni Randevu Oluştur</h1>
            <p className="text-muted-foreground">Aşağıdaki adımları takip ederek yeni bir randevu oluşturun</p>
          </div>
        </div>
        
        <Separator />
        
        <div className="py-4">
          <AppointmentWizard
            branchId={branchId}
            selectedDate={selectedDate}
            selectedStaffId={selectedStaffId}
            startTime={startTime}
          />
        </div>
      </div>
    </div>
  );
}