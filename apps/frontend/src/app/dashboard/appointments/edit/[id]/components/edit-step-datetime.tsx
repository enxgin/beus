'use client';

import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import api from '@/lib/api';
import { Calendar } from '@/components/ui/calendar';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface EditStepDateTimeProps {
  staffId: string | undefined;
  serviceId: string | undefined;
  branchId: string | undefined;
  selectedDate: Date | undefined;
  selectedTime: string;
  onSelectDate: (date: Date | undefined) => void;
  onSelectTime: (time: string) => void;
}

async function fetchAvailableSlots(
  staffId?: string,
  serviceId?: string,
  date?: Date,
  branchId?: string,
): Promise<string[]> {
  if (!staffId || !serviceId || !date || !branchId) {
    return [];
  }
  const params = {
    staffId,
    serviceId,
    date: format(date, 'yyyy-MM-dd'),
    branchId,
  };
  const { data } = await api.get<string[]>('/appointments/available-slots', {
    params,
  });
  return data.map((slot) => format(new Date(slot), 'HH:mm'));
}

export function EditStepDateTime({
  staffId,
  serviceId,
  branchId,
  selectedDate,
  selectedTime,
  onSelectDate,
  onSelectTime,
}: EditStepDateTimeProps) {
  const {
    data: availableSlots,
    isLoading: isLoadingSlots,
    isError,
  } = useQuery<string[]>({
    queryKey: ['available-slots', staffId, serviceId, selectedDate, branchId],
    queryFn: () => fetchAvailableSlots(staffId, serviceId, selectedDate, branchId),
    enabled: !!staffId && !!serviceId && !!selectedDate && !!branchId,
  });

  const handleDateSelect = (date: Date | undefined) => {
    onSelectDate(date);
    onSelectTime('');
  };

  // Mevcut randevu saatini de listeye ekle ve sırala
  const allSlots = [...new Set([...(availableSlots || []), selectedTime])].sort();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tarih ve Saat Seçimi</CardTitle>
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
              disabled={(date) =>
                date < new Date(new Date().setDate(new Date().getDate() - 1))
              }
              className="rounded-md border"
            />
          </div>
        </div>
        <div>
          <h3 className="font-semibold mb-4 text-center">Uygun Saatler</h3>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {isLoadingSlots &&
              Array.from({ length: 12 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            {!isLoadingSlots && isError && (
              <p className="col-span-full text-center text-destructive">
                Saatler yüklenemedi.
              </p>
            )}
            {!isLoadingSlots && !isError && !allSlots?.length && (
              <p className="col-span-full text-center text-muted-foreground">
                Seçili tarih için uygun saat bulunamadı.
              </p>
            )}
            {!isLoadingSlots &&
              !isError &&
              allSlots?.map((slot) => (
                <button
                  key={slot}
                  onClick={() => onSelectTime(slot)}
                  type="button"
                  className={`p-2 border rounded-lg cursor-pointer transition-all text-sm ${
                    selectedTime === slot
                      ? 'border-primary ring-2 ring-primary bg-primary text-primary-foreground'
                      : 'border-border hover:bg-muted'
                  }`}
                >
                  {slot}
                </button>
              ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
