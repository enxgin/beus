'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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
  customerPackageId?: string; // Müşteri paket ID'si (paket seçildiyse)
  packageServiceId?: string; // Paket hizmet ID'si (paket seçildiyse)
}

const STEPS = {
  CUSTOMER: 1,
  SERVICE: 2,
  STAFF: 3,
  DATETIME: 4,
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
  customerPackageId?: string; // Müşteri paket ID'si (paket seçildiyse)
  packageServiceId?: string; // Paket hizmet ID'si (paket seçildiyse)
}

export function AppointmentWizard({ branchId, selectedDate, selectedStaffId, startTime }: AppointmentWizardProps) {
  const [currentStep, setCurrentStep] = useState(STEPS.CUSTOMER);
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
    if (currentStep === STEPS.CUSTOMER) {
      // Müşteri seçili değilse ilerleyemez
      if (!formData.customer) {
        toast({ title: 'Hata', description: 'Lütfen bir müşteri seçin veya yeni müşteri oluşturun', variant: 'destructive' });
        return;
      }
      setCurrentStep(STEPS.SERVICE);
    } else if (currentStep === STEPS.SERVICE) {
      // Hizmet seçili değilse ilerleyemez
      if (!formData.service) {
        toast({ title: 'Hata', description: 'Lütfen bir hizmet seçin', variant: 'destructive' });
        return;
      }
      setCurrentStep(STEPS.STAFF);
    } else if (currentStep === STEPS.STAFF) {
      // Personel seçili değilse ilerleyemez
      if (!formData.staff) {
        toast({ title: 'Hata', description: 'Lütfen bir personel seçin', variant: 'destructive' });
        return;
      }
      setCurrentStep(STEPS.DATETIME);
    } else if (currentStep === STEPS.DATETIME) {
      // Tarih ve saat seçili değilse ilerleyemez
      if (!formData.date || !formData.time) {
        toast({ title: 'Hata', description: 'Lütfen randevu için tarih ve saat seçin', variant: 'destructive' });
        return;
      }
      // Son adımda randevuyu oluştur
      handleConfirm();
    }
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

    // Paket seçimi yapıldıysa konsola yazdır
    if (formData.customerPackageId) {
      console.log('Paket randevusu oluşturuluyor:', {
        customerPackageId: formData.customerPackageId,
        packageServiceId: formData.packageServiceId,
        service: formData.service
      });
    }

    const payload: CreateAppointmentPayload = {
      branchId: formData.branchId,
      customerId: formData.customer.id,
      staffId: formData.staff.id,
      serviceId: formData.service.id,
      startTime,
      endTime,
      duration, // Backend'e duration alanını gönderiyoruz
    };
    
    // Eğer paket seçimi yapıldıysa bu bilgileri de gönder
    if (formData.customerPackageId) {
      payload.customerPackageId = formData.customerPackageId;
      
      // packageServiceId yerine serviceId kullanıyoruz, çünkü backend'de bu şekilde bekleniyor
      // packageServiceId, paket içindeki hizmet kaydının ID'si
      // ancak backend'de customerPackage.remainingSessions[serviceId] şeklinde kullanılıyor
      if (formData.packageServiceId) {
        payload.packageServiceId = formData.packageServiceId;
      }
    }

    console.log('Randevu oluşturma payload:', payload);
    createAppointmentMutation.mutate(payload);
  };

  // Step indicator component to match design
  const renderStepIndicators = () => {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-8">
              {/* Adım 1: Müşteri */}
              <div className="flex items-center" id="step-1-indicator">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full ${currentStep > STEPS.CUSTOMER ? 'bg-green-600 text-white' : currentStep === STEPS.CUSTOMER ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'} text-sm font-medium`}>
                  {currentStep > STEPS.CUSTOMER ? <i className="fas fa-check"></i> : '1'}
                </div>
                <span className={`ml-2 text-sm font-medium ${currentStep > STEPS.CUSTOMER ? 'text-green-600' : currentStep === STEPS.CUSTOMER ? 'text-gray-900' : 'text-gray-600'}`}>Müşteri Seçimi</span>
              </div>
              
              {/* Çizgi */}
              <div className={`flex-1 h-0.5 ${currentStep > STEPS.CUSTOMER ? 'bg-green-600' : 'bg-gray-200'}`} id="line-1"></div>
              
              {/* Adım 2: Hizmet/Paket */}
              <div className="flex items-center" id="step-2-indicator">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full ${currentStep > STEPS.SERVICE ? 'bg-green-600 text-white' : currentStep === STEPS.SERVICE ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'} text-sm font-medium`}>
                  {currentStep > STEPS.SERVICE ? <i className="fas fa-check"></i> : '2'}
                </div>
                <span className={`ml-2 text-sm font-medium ${currentStep > STEPS.SERVICE ? 'text-green-600' : currentStep === STEPS.SERVICE ? 'text-gray-900' : 'text-gray-600'}`}>Hizmet/Paket</span>
              </div>
              
              {/* Çizgi */}
              <div className={`flex-1 h-0.5 ${currentStep > STEPS.SERVICE ? 'bg-green-600' : 'bg-gray-200'}`} id="line-2"></div>
              
              {/* Adım 3: Personel */}
              <div className="flex items-center" id="step-3-indicator">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full ${currentStep > STEPS.STAFF ? 'bg-green-600 text-white' : currentStep === STEPS.STAFF ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'} text-sm font-medium`}>
                  {currentStep > STEPS.STAFF ? <i className="fas fa-check"></i> : '3'}
                </div>
                <span className={`ml-2 text-sm font-medium ${currentStep > STEPS.STAFF ? 'text-green-600' : currentStep === STEPS.STAFF ? 'text-gray-900' : 'text-gray-600'}`}>Personel</span>
              </div>
              
              {/* Çizgi */}
              <div className={`flex-1 h-0.5 ${currentStep > STEPS.STAFF ? 'bg-green-600' : 'bg-gray-200'}`} id="line-3"></div>
              
              {/* Adım 4: Tarih/Saat */}
              <div className="flex items-center" id="step-4-indicator">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full ${currentStep === STEPS.DATETIME ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'} text-sm font-medium`}>
                  4
                </div>
                <span className={`ml-2 text-sm font-medium ${currentStep === STEPS.DATETIME ? 'text-gray-900' : 'text-gray-600'}`}>Tarih & Saat</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderStep = () => {
    switch (currentStep) {
      case STEPS.CUSTOMER:
        return <StepCustomer formData={formData} onSelectCustomer={(customer) => updateFormData({ customer })} />;
      case STEPS.SERVICE:
        return <StepService 
          formData={formData} 
          onSelectService={(service, customerPackageId, packageServiceId) => {
            updateFormData({ 
              service, 
              customerPackageId, 
              packageServiceId 
            });
          }} 
        />;
      case STEPS.STAFF:
        return <StepStaff formData={formData} onSelectStaff={(staff) => updateFormData({ staff })} selectedStaffId={selectedStaffId} />;
      case STEPS.DATETIME:
        return <StepDateTime formData={formData} onUpdateDateTime={(date, time, duration) => updateFormData({ date, time, duration })} />;
      default:
        return null;
    }
  };

  return (
    <div>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Yeni Randevu Oluştur</h1>
              <p className="text-gray-600">Adım adım randevu oluşturun</p>
            </div>
            <Button variant="secondary" asChild>
              <Link href="/dashboard/appointments/calendar">Takvime Dön</Link>
            </Button>
          </div>
        </div>
        
        {/* Sihirbaz Adımları */}
        {renderStepIndicators()}
        
        {/* Form Container */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6">
            {renderStep()}
          </div>
          
          {/* Navigasyon Butonları */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between">
            {currentStep > STEPS.CUSTOMER ? (
              <Button variant="ghost" onClick={handleBack} disabled={createAppointmentMutation.isPending}>
                <i className="fas fa-arrow-left mr-2"></i>
                Önceki
              </Button>
            ) : (
              <div></div>
            )}
            
            <div className="flex space-x-3 ml-auto">
              <Button variant="ghost" asChild>
                <Link href="/dashboard/appointments/calendar">İptal</Link>
              </Button>
              
              {currentStep < STEPS.DATETIME ? (
                <Button onClick={handleNext} className="bg-blue-600 hover:bg-blue-700">
                  Sonraki <i className="fas fa-arrow-right ml-2"></i>
                </Button>
              ) : (
                <Button onClick={handleConfirm} disabled={createAppointmentMutation.isPending} className="bg-green-600 hover:bg-green-700">
                  <i className="fas fa-save mr-2"></i>
                  {createAppointmentMutation.isPending ? 'Oluşturuluyor...' : 'Randevu Oluştur'}
                </Button>
              )}
            </div>
          </div>
        </div>
      
      </div>
    </div>
  );
}
