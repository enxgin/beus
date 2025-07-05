'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient, UseMutationResult } from '@tanstack/react-query';
import { StepService } from './step-service';
import { StepStaff } from './step-staff';
import { StepDateTime } from './step-datetime';
import { StepCustomer } from './step-customer';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Service, User, Customer } from '@/lib/prisma-client';
import api from '@/lib/api';
import { addMinutes, setHours, setMinutes } from 'date-fns';

interface AppointmentWizardProps {
  branchId?: string;
  selectedDate?: string;
  selectedStaffId?: string;
  startTime?: string;
}

export interface AppointmentFormData {
  branchId?: string;
  service?: Service;
  staff?: User;
  date?: Date;
  time?: string;
  customer?: Customer;
  duration?: number; // Randevu süresi (dakika)
}

const STEPS = {
  SERVICE: 1,
  STAFF: 2,
  DATETIME: 3,
  CUSTOMER: 4,
  CONFIRM: 5,
};

// API'ye gönderilecek veri yapısı
interface CreateAppointmentPayload {
  branchId: string;
  customerId: string;
  staffId: string;
  serviceId: string;
  startTime: Date;
  endTime: Date;
  duration: number; // Randevu süresi (dakika)
  notes?: string;
}

export function AppointmentWizard({ branchId, selectedDate, selectedStaffId, startTime }: AppointmentWizardProps) {
  const [currentStep, setCurrentStep] = useState(STEPS.SERVICE);
  const [formData, setFormData] = useState<AppointmentFormData>({});
  const { toast } = useToast();
  const router = useRouter();
  const queryClient = useQueryClient();

  useEffect(() => {
    const initialFormData: AppointmentFormData = { branchId };
    if (selectedDate) {
      initialFormData.date = new Date(selectedDate);
    }
    if (startTime) {
      initialFormData.time = startTime;
    }
    setFormData(initialFormData);
  }, [branchId, selectedDate, startTime]);

  const createAppointmentMutation = useMutation<any, Error, CreateAppointmentPayload>({
    mutationFn: (newAppointment: CreateAppointmentPayload) =>
      api.post('/appointments', newAppointment),
    onSuccess: () => {
      toast({
        title: 'Başarılı!',
        description: 'Randevu başarıyla oluşturuldu.',
      });
      queryClient.invalidateQueries({
        queryKey: ['calendarData', formData.branchId],
      });
      router.push(
        `/dashboard/appointments/calendar?branchId=${formData.branchId}`,
      );
    },
    onError: (error: any) => {
      toast({
        title: 'Hata',
        description:
          error.response?.data?.message ||
          'Randevu oluşturulurken bir hata oluştu.',
        variant: 'destructive',
      });
    },
  });

  const updateFormData = (newData: Partial<AppointmentFormData>) => {
    setFormData((prev) => ({ ...prev, ...newData }));
  };

  const handleNext = () => {
    if (currentStep === STEPS.SERVICE && !formData.service) {
      toast({ title: 'Hata', description: 'Lütfen bir hizmet seçin.', variant: 'destructive' });
      return;
    }
    if (currentStep === STEPS.STAFF && !formData.staff) {
      toast({ title: 'Hata', description: 'Lütfen bir personel seçin.', variant: 'destructive' });
      return;
    }
    if (currentStep === STEPS.DATETIME && (!formData.date || !formData.time)) {
      toast({ title: 'Hata', description: 'Lütfen tarih ve saat seçin.', variant: 'destructive' });
      return;
    }
    if (currentStep === STEPS.CUSTOMER && !formData.customer) {
      toast({ title: 'Hata', description: 'Lütfen bir müşteri seçin.', variant: 'destructive' });
      return;
    }
    setCurrentStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setCurrentStep((prev) => prev - 1);
  };

  const handleConfirm = () => {
    if (!formData.branchId || !formData.customer || !formData.staff || !formData.service || !formData.date || !formData.time) {
      toast({
        title: 'Eksik Bilgi',
        description: 'Lütfen tüm randevu bilgilerini doldurun.',
        variant: 'destructive',
      });
      return;
    }

    const [hours, minutes] = formData.time ? formData.time.split(':').map(Number) : [0, 0];
    if (!formData.date || hours === null || minutes === null) {
      toast({
        title: 'Hata',
        description: 'Geçersiz tarih veya saat seçimi.',
        variant: 'destructive',
      });
      return;
    }
    
    const startTime = setMinutes(setHours(formData.date, hours), minutes);
    // Randevu süresini al - öncelikle form verisinden, yoksa hizmet süresinden
    const duration = formData.duration || formData.service?.duration || 30;
    const endTime = addMinutes(startTime, duration);

    const payload: CreateAppointmentPayload = {
      branchId: formData.branchId,
      customerId: formData.customer.id,
      staffId: formData.staff.id,
      serviceId: formData.service.id,
      startTime,
      endTime,
      duration, // Backend'e duration alanını gönderiyoruz
    };

    createAppointmentMutation.mutate(payload);
  };

  const renderStep = () => {
    switch (currentStep) {
      case STEPS.SERVICE:
        return <StepService formData={formData} onSelectService={(service) => updateFormData({ service })} />;
      case STEPS.STAFF:
        return <StepStaff formData={formData} onSelectStaff={(staff) => updateFormData({ staff })} selectedStaffId={selectedStaffId} />;
      case STEPS.DATETIME:
        return <StepDateTime formData={formData} onUpdateDateTime={(date, time, duration) => updateFormData({ date, time, duration })} />;
      case STEPS.CUSTOMER:
        return <StepCustomer formData={formData} onSelectCustomer={(customer) => updateFormData({ customer })} />;
      case STEPS.CONFIRM:
        return (
          <div className="p-4 border rounded-lg space-y-2">
            <h3 className="text-lg font-semibold">Randevu Özeti</h3>
            <p><strong>Müşteri:</strong> {formData.customer?.name}</p>
            <p><strong>Personel:</strong> {formData.staff?.name}</p>
            <p><strong>Hizmet:</strong> {formData.service?.name}</p>
            <p><strong>Tarih:</strong> {formData.date ? formData.date.toLocaleDateString() : ''} - {formData.time}</p>
            <p><strong>Süre:</strong> {formData.duration || formData.service?.duration || 30} dakika</p>
          </div>
        );
      default:
        return <div>Bilinmeyen Adım</div>;
    }
  };

  return (
    <div>
      {renderStep()}
      <div className="flex justify-between mt-8">
        {currentStep > STEPS.SERVICE && (
          <Button variant="outline" onClick={handleBack} disabled={createAppointmentMutation.isPending}>
            Geri
          </Button>
        )}
        {currentStep < STEPS.CONFIRM ? (
          <Button onClick={handleNext} className="ml-auto">
            İleri
          </Button>
        ) : (
          <Button onClick={handleConfirm} disabled={createAppointmentMutation.isPending} className="ml-auto">
            {createAppointmentMutation.isPending ? 'Oluşturuluyor...' : 'Randevuyu Onayla'}
          </Button>
        )}
      </div>
    </div>
  );
}
