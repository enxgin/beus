'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import { MoreHorizontal, Search, Eye, Pencil, Trash2, Calendar } from 'lucide-react';
import api from '@/lib/api';

interface AppointmentListProps {
  branchId: string;
}

interface Appointment {
  id: string;
  customerId: string;
  customer: {
    id: string;
    name: string;
    phone: string;
    email: string;
  };
  staffId: string;
  staff: {
    id: string;
    name: string;
  };
  serviceId: string;
  service: {
    id: string;
    name: string;
    price: number;
    duration: number;
  };
  startTime: string;
  endTime: string;
  duration: number;
  status: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export function AppointmentList({ branchId }: AppointmentListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [appointmentToDelete, setAppointmentToDelete] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Randevuları getir
  const { data: appointments, isLoading } = useQuery<Appointment[]>({
    queryKey: ['appointments', branchId],
    queryFn: async () => {
      const { data } = await api.get(`/appointments?branchId=${branchId}`);
      return data;
    },
    enabled: !!branchId,
  });

  // Randevu silme mutasyonu
  const deleteAppointmentMutation = useMutation({
    mutationFn: (appointmentId: string) => 
      api.delete(`/appointments/${appointmentId}`),
    onSuccess: () => {
      toast({
        title: 'Başarılı',
        description: 'Randevu başarıyla silindi.',
      });
      queryClient.invalidateQueries({ queryKey: ['appointments', branchId] });
      queryClient.invalidateQueries({ queryKey: ['calendarData', branchId] });
      setAppointmentToDelete(null);
    },
    onError: (error: any) => {
      toast({
        title: 'Hata',
        description: error.response?.data?.message || 'Randevu silinirken bir hata oluştu.',
        variant: 'destructive',
      });
    },
  });

  // Arama filtreleme fonksiyonu
  const filteredAppointments = appointments?.filter(appointment => {
    const searchLower = searchTerm.toLowerCase();
    return (
      appointment.customer.name.toLowerCase().includes(searchLower) ||
      appointment.staff.name.toLowerCase().includes(searchLower) ||
      appointment.service.name.toLowerCase().includes(searchLower) ||
      format(parseISO(appointment.startTime), 'dd MMMM yyyy HH:mm', { locale: tr }).toLowerCase().includes(searchLower)
    );
  });

  // Randevu detay sayfasına git
  const handleViewAppointment = (id: string) => {
    router.push(`/dashboard/appointments/view/${id}?branchId=${branchId}`);
  };

  // Randevu düzenleme sayfasına git
  const handleEditAppointment = (id: string) => {
    router.push(`/dashboard/appointments/edit/${id}?branchId=${branchId}`);
  };

  // Randevu silme işlemi
  const handleDeleteAppointment = () => {
    if (appointmentToDelete) {
      deleteAppointmentMutation.mutate(appointmentToDelete);
    }
  };

  // Takvim görünümüne git
  const handleGoToCalendar = () => {
    router.push(`/dashboard/appointments/calendar?branchId=${branchId}`);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleGoToCalendar}
            className="whitespace-nowrap"
          >
            <Calendar className="mr-2 h-4 w-4" />
            Takvim Görünümü
          </Button>
          <Button 
            onClick={() => router.push(`/dashboard/appointments/create?branchId=${branchId}`)}
            className="whitespace-nowrap"
          >
            Yeni Randevu
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : (
        <>
          {filteredAppointments && filteredAppointments.length > 0 ? (
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tarih & Saat</TableHead>
                    <TableHead>Müşteri</TableHead>
                    <TableHead>Personel</TableHead>
                    <TableHead>Hizmet</TableHead>
                    <TableHead>Süre</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead className="w-[80px]">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAppointments.map((appointment) => (
                    <TableRow key={appointment.id}>
                      <TableCell className="font-medium">
                        {format(parseISO(appointment.startTime), 'dd MMMM yyyy', { locale: tr })}
                        <br />
                        <span className="text-muted-foreground">
                          {format(parseISO(appointment.startTime), 'HH:mm', { locale: tr })} - {format(parseISO(appointment.endTime), 'HH:mm', { locale: tr })}
                        </span>
                      </TableCell>
                      <TableCell>{appointment.customer.name}</TableCell>
                      <TableCell>{appointment.staff.name}</TableCell>
                      <TableCell>{appointment.service.name}</TableCell>
                      <TableCell>{appointment.duration} dk</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          appointment.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                          appointment.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {appointment.status === 'COMPLETED' ? 'Tamamlandı' :
                           appointment.status === 'CANCELLED' ? 'İptal Edildi' :
                           'Bekliyor'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">İşlemler</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>İşlemler</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleViewAppointment(appointment.id)}>
                              <Eye className="mr-2 h-4 w-4" />
                              Görüntüle
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditAppointment(appointment.id)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Düzenle
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => setAppointmentToDelete(appointment.id)}
                              className="text-red-600 focus:text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Sil
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? 'Arama kriterlerine uygun randevu bulunamadı.' : 'Henüz randevu bulunmuyor.'}
            </div>
          )}
        </>
      )}

      {/* Silme onay dialog'u */}
      <AlertDialog open={!!appointmentToDelete} onOpenChange={(open) => !open && setAppointmentToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Randevuyu silmek istediğinize emin misiniz?</AlertDialogTitle>
            <AlertDialogDescription>
              Bu işlem geri alınamaz. Randevu kalıcı olarak silinecektir.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteAppointment}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteAppointmentMutation.isPending ? 'Siliniyor...' : 'Evet, Sil'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
