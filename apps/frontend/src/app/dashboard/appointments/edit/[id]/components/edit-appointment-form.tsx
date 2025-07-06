'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient, UseMutationResult } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import api from '@/lib/api';
import { format, parseISO, setHours, setMinutes } from 'date-fns';

// Yeni modüler bileşenleri import edelim
import { EditStepService } from './edit-step-service';
import { EditStepStaff } from './edit-step-staff';
import { EditStepDateTime } from './edit-step-datetime';

// Gelen veri ve state tiplerini tanımlayalım
interface Service {
  id: string;
  name: string;
  duration: number;
  price: number;
}

interface Staff {
  id: string;
  name: string;
  role: any; // Rol tipi backend'den geldiği gibi
}

interface CustomerPackageService {
  id: string;
  serviceId: string;
  sessions: number;
  service: Service;
}

interface CustomerPackage {
  id: string;
  expiryDate: string;
  remainingSessions: Record<string, number>;
  package: {
    id: string;
    name: string;
    services: CustomerPackageService[];
  };
}

interface Appointment {
  id: string;
  startTime: string;
  status: string;
  notes: string | null;
  service: Service;
  staff: Staff;
  branchId: string;
  customerPackage?: CustomerPackage;
  packageServiceId?: string;
}

interface EditAppointmentFormProps {
  appointment: Appointment;
}

const statusTranslations: { [key: string]: string } = {
  CONFIRMED: 'Onaylandı',
  COMPLETED: 'Tamamlandı',
  CANCELLED: 'İptal Edildi',
  NO_SHOW: 'Gelmedi',
};

const statusValues = Object.keys(statusTranslations);

export function EditAppointmentForm({ appointment }: EditAppointmentFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Form state'lerini başlatalım
  const [selectedService, setSelectedService] = useState<Service | null>(
    appointment.service,
  );
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(
    appointment.staff,
  );
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    parseISO(appointment.startTime),
  );
  const [selectedTime, setSelectedTime] = useState<string>(
    format(parseISO(appointment.startTime), 'HH:mm'),
  );
  const [status, setStatus] = useState(appointment.status);
  const [notes, setNotes] = useState(appointment.notes || '');

  const updateAppointmentMutation = useMutation<any, Error, any>({
    mutationFn: (updatedData: any) =>
      api.put(`/appointments/${appointment.id}`, updatedData),
    onSuccess: () => {
      toast({
        title: 'Başarılı',
        description: 'Randevu başarıyla güncellendi.',
      });
      queryClient.invalidateQueries({ queryKey: ['appointment', appointment.id] });
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      router.push('/dashboard/appointments/calendar');
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Hata',
        description:
          error.response?.data?.message ||
          'Güncelleme sırasında bir hata oluştu.',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedService || !selectedStaff || !selectedDate || !selectedTime) {
      toast({
        variant: 'destructive',
        title: 'Eksik Bilgi',
        description: 'Lütfen tüm alanları doldurduğunuzdan emin olun.',
      });
      return;
    }

    const [hours, minutes] = selectedTime.split(':').map(Number);
    const startTime = setMinutes(setHours(selectedDate, hours), minutes);

    const payload = {
      serviceId: selectedService.id,
      staffId: selectedStaff.id,
      startTime: startTime.toISOString(),
      status,
      notes,
    };

    updateAppointmentMutation.mutate(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {appointment.customerPackage ? (
        <Card>
          <CardHeader>
            <CardTitle>Seçilen Paket</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-semibold mb-2">{appointment.customerPackage.package.name}</p>
            {appointment.packageServiceId && (
              <>
                {appointment.customerPackage.package.services.map((ps) =>
                  ps.id === appointment.packageServiceId ? (
                    <div key={ps.id} className="flex items-center justify-between">
                      <span>{ps.service.name}</span>
                      <span className="text-sm text-muted-foreground">
                        Kalan: {appointment.customerPackage?.remainingSessions[ps.serviceId] ?? 0}/{ps.sessions}
                      </span>
                    </div>
                  ) : null,
                )}
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <EditStepService
          branchId={appointment.branchId}
          selectedService={selectedService}
          onSelectService={setSelectedService}
        />
      )}

      <EditStepStaff
        branchId={appointment.branchId}
        serviceId={selectedService?.id}
        selectedStaff={selectedStaff}
        onSelectStaff={setSelectedStaff}
      />

      <EditStepDateTime
        staffId={selectedStaff?.id}
        serviceId={selectedService?.id}
        branchId={appointment.branchId}
        selectedDate={selectedDate}
        selectedTime={selectedTime}
        onSelectDate={setSelectedDate}
        onSelectTime={setSelectedTime}
      />

      <Card>
        <CardHeader>
          <CardTitle>Randevu Durumu</CardTitle>
        </CardHeader>
        <CardContent>
          <Label htmlFor="status">Durum</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger id="status">
              <SelectValue placeholder="Durum seçin" />
            </SelectTrigger>
            <SelectContent>
              {statusValues.map((statusKey) => (
                <SelectItem key={statusKey} value={statusKey}>
                  {statusTranslations[statusKey]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notlar</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Randevu ile ilgili notlarınız..."
          />
        </CardContent>
      </Card>

      <Button
        type="submit"
        className="w-full"
        disabled={updateAppointmentMutation.isPending}
      >
        {updateAppointmentMutation.isPending
          ? 'Güncelleniyor...'
          : 'Randevuyu Güncelle'}
      </Button>
    </form>
  );
}
