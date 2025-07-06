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
      <div className="flex flex-col space-y-4">
        {/* Breadcrumbs */}
        <nav className="flex" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2 text-sm text-gray-500">
            <li>
              <a href="/dashboard" className="hover:text-gray-700">Dashboard</a>
            </li>
            <li className="flex items-center">
              <span className="mx-1">/</span>
              <a href="/dashboard/appointments/calendar" className="hover:text-gray-700">Randevular</a>
            </li>
            <li className="flex items-center">
              <span className="mx-1">/</span>
              <span className="text-gray-900">Yeni Randevu</span>
            </li>
          </ol>
        </nav>
        
        <div className="py-2">
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