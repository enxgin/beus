'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import api from '@/lib/api';
import { AppointmentFormData } from './appointment-wizard';
import { Calendar } from '@/components/ui/calendar';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface StepDateTimeProps {
  formData: AppointmentFormData;
  onUpdateDateTime: (date: Date, time: string, duration?: number) => void;
}

interface TimeSlot {
  startTime: string;
  endTime: string;
}

async function fetchAvailableSlots(staffId?: string, date?: Date, serviceId?: string, branchId?: string): Promise<TimeSlot[]> {
  if (!staffId || !date || !serviceId || !branchId) {
    console.log('Slot sorgusu için eksik parametreler:', { staffId, date, serviceId, branchId });
    return [];
  }

  const params = {
    staffId,
    serviceId,
    date: format(date, 'yyyy-MM-dd'),
    branchId,
  };

  console.log('API isteği gönderiliyor: /appointments/available-slots', params);
  try {
    const { data } = await api.get<string[]>('/appointments/available-slots', { params });
    
    console.log('API yanıtı (available-slots):', data);
    if (!data || !Array.isArray(data)) return [];
    
    // Backend ISO tarih dizisi döndürüyor, bunları saat formatına çevirelim
    return data.map(dateTimeStr => {
      const dateTime = new Date(dateTimeStr);
      return {
        startTime: format(dateTime, 'HH:mm'),
        endTime: format(new Date(dateTime.getTime() + 30*60*1000), 'HH:mm'), // 30 dakika varsayılan süre
      };
    });
  } catch (error) {
    console.error('Uygun saatler alınırken hata oluştu:', error);
    return [];
  }
}

export function StepDateTime({ formData, onUpdateDateTime }: StepDateTimeProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(formData.date);
  const [duration, setDuration] = useState<number | undefined>(formData.duration || formData.service?.duration || 30);

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      onUpdateDateTime(date, formData.time || '', duration); 
    }
  };
  
  const handleTimeSelect = (slot: TimeSlot) => {
    if (selectedDate) {
      onUpdateDateTime(selectedDate, slot.startTime, duration);
    }
  };
  
  const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDuration = parseInt(e.target.value);
    if (!isNaN(newDuration) && newDuration > 0) {
      setDuration(newDuration);
      if (selectedDate && formData.time) {
        onUpdateDateTime(selectedDate, formData.time, newDuration);
      }
    }
  };
  
  // Varsayılan saatler (API boş döndüğünde kullanılacak)
  const generateDefaultTimeSlots = (): TimeSlot[] => {
    const slots: TimeSlot[] = [];
    // 09:00'dan 18:00'a kadar 30 dakikalık aralıklarla saatler oluştur
    for (let hour = 9; hour < 18; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const startHour = hour.toString().padStart(2, '0');
        const startMinute = minute.toString().padStart(2, '0');
        const endHour = minute === 30 ? hour.toString().padStart(2, '0') : (hour + 1).toString().padStart(2, '0');
        const endMinute = minute === 30 ? '00' : '30';
        
        slots.push({
          startTime: `${startHour}:${startMinute}`,
          endTime: `${endHour}:${endMinute}`,
        });
      }
    }
    return slots;
  };

  const { data: availableSlots, isLoading: isLoadingSlots } = useQuery<TimeSlot[]>({ 
    queryKey: ['available-slots', formData.staff?.id, selectedDate, formData.service?.id, formData.branchId],
    queryFn: async () => {
      const result = await fetchAvailableSlots(
        formData.staff?.id, 
        selectedDate, 
        formData.service?.id, 
        formData.branchId
      );
      
      // Eğer API boş sonuç döndürüyorsa, varsayılan saatleri kullan
      if (result.length === 0) {
        console.log('DEBUG - API boş sonuç döndürdü, varsayılan saatler kullanılıyor');
        return generateDefaultTimeSlots();
      }
      
      return result;
    },
    enabled: !!formData.staff?.id && !!selectedDate && !!formData.service?.id && !!formData.branchId,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Adım 3: Tarih ve Saat Seçimi</CardTitle>
      </CardHeader>
      <CardContent className="grid md:grid-cols-2 gap-8">
        <div>
          <h3 className="font-semibold mb-4 text-center">Tarih Seçin</h3>
          <div className="flex justify-center">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              locale={tr}
              disabled={(date) => date < new Date(new Date().setDate(new Date().getDate() - 1))}
              className="rounded-md border"
            />
          </div>
        </div>
        
        {selectedDate && (
          <div>
            <h3 className="font-semibold mb-4 text-center">Uygun Saatler</h3>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {isLoadingSlots && Array.from({ length: 12 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
              {!isLoadingSlots && availableSlots?.length === 0 && (
                <p className="col-span-full text-center text-muted-foreground">
                  Seçili tarih için uygun saat bulunamadı.
                </p>
              )}
              {availableSlots?.map((slot) => (
                <button
                  key={slot.startTime}
                  onClick={() => handleTimeSelect(slot)}
                  className={`p-2 border rounded-lg cursor-pointer transition-all text-sm ${
                    formData.time === slot.startTime
                      ? 'border-primary ring-2 ring-primary bg-primary text-primary-foreground'
                      : 'border-border hover:bg-muted'
                  }`}
                >
                  {slot.startTime}
                </button>
              ))}
            </div>
            
            <div className="mt-6">
              <h3 className="font-semibold mb-4 text-center">Randevu Süresi (Dakika)</h3>
              <div className="flex items-center gap-2">
                <Label htmlFor="duration">Süre:</Label>
                <Input
                  id="duration"
                  type="number"
                  min="5"
                  max="240"
                  value={duration}
                  onChange={handleDurationChange}
                  className="w-24"
                  placeholder="Dakika"
                />
                <span className="text-sm text-muted-foreground">
                  {formData.service?.duration ? `Önerilen: ${formData.service.duration} dk` : ''}
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
