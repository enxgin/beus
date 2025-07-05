'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { useAuthStore } from '@/stores/auth.store';
import { useToast } from '@/components/ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { format, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Clock, Calendar, UserCircle, Info, Package, Phone, Mail } from 'lucide-react';
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

interface AppointmentDetailModalProps {
  appointment: any;
  isOpen: boolean;
  onClose: () => void;
  onAppointmentUpdate: () => void;
}

export function AppointmentDetailModal({
  appointment,
  isOpen,
  onClose,
  onAppointmentUpdate,
}: AppointmentDetailModalProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { token } = useAuthStore();
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);

  // Randevu silme işlemi
  const deleteAppointmentMutation = useMutation({
    mutationFn: async () => {
      await axios.delete(`/api/appointments/${appointment.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    },
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "Randevu başarıyla silindi",
      });
      onClose();
      onAppointmentUpdate();
    },
    onError: (error) => {
      toast({
        title: "Hata",
        description: "Randevu silinirken bir hata oluştu",
        variant: "destructive",
      });
      console.error('Randevu silme hatası:', error);
    },
  });

  // Randevu düzenleme sayfasına git
  const handleEdit = () => {
    router.push(`/dashboard/appointments/edit/${appointment.id}`);
    onClose();
  };

  // Randevu silme onayını göster
  const handleDeleteClick = () => {
    setIsDeleteAlertOpen(true);
  };

  // Randevu sil
  const handleConfirmDelete = () => {
    deleteAppointmentMutation.mutate();
    setIsDeleteAlertOpen(false);
  };

  if (!appointment) return null;

  // Randevu tarihi ve saatini formatlı gösterme
  const formattedDate = appointment.date
    ? format(parseISO(appointment.date), 'PPP', { locale: tr })
    : '';

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Randevu Detayları</DialogTitle>
            <DialogDescription>
              {formattedDate} tarihli randevu bilgileri
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Randevu durumu */}
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Durum</h3>
              <Badge
                variant={
                  appointment.status === 'COMPLETED'
                    ? 'success'
                    : appointment.status === 'CANCELED'
                    ? 'destructive'
                    : 'default'
                }
              >
                {appointment.status === 'SCHEDULED' && 'Planlandı'}
                {appointment.status === 'COMPLETED' && 'Tamamlandı'}
                {appointment.status === 'CANCELED' && 'İptal Edildi'}
                {appointment.status === 'PENDING' && 'Beklemede'}
              </Badge>
            </div>

            <Separator />
            
            {/* Müşteri bilgisi */}
            <div className="space-y-2">
              <h3 className="flex items-center text-sm font-medium text-muted-foreground">
                <UserCircle className="w-4 h-4 mr-2" />
                Müşteri Bilgileri
              </h3>
              
              <div className="text-sm">
                <p className="font-medium">
                  {appointment.customer?.firstName} {appointment.customer?.lastName}
                </p>
                {appointment.customer?.phone && (
                  <div className="flex items-center mt-1 text-muted-foreground">
                    <Phone className="w-3 h-3 mr-1" />
                    <span>{appointment.customer.phone}</span>
                  </div>
                )}
                {appointment.customer?.email && (
                  <div className="flex items-center mt-1 text-muted-foreground">
                    <Mail className="w-3 h-3 mr-1" />
                    <span>{appointment.customer.email}</span>
                  </div>
                )}
              </div>
            </div>
            
            <Separator />
            
            {/* Hizmet bilgisi */}
            <div className="space-y-2">
              <h3 className="flex items-center text-sm font-medium text-muted-foreground">
                <Package className="w-4 h-4 mr-2" />
                Hizmet Bilgileri
              </h3>
              
              <div className="text-sm">
                <p className="font-medium">{appointment.service?.name || 'Tanımsız Hizmet'}</p>
                <div className="flex items-center justify-between mt-1">
                  <div className="flex items-center text-muted-foreground">
                    <Clock className="w-3 h-3 mr-1" />
                    <span>{appointment.duration} dakika</span>
                  </div>
                  <div className="font-medium">
                    {appointment.price ? `${appointment.price.toFixed(2)} ₺` : 'Paket'}
                  </div>
                </div>
              </div>
            </div>
            
            <Separator />
            
            {/* Zaman bilgisi */}
            <div className="space-y-2">
              <h3 className="flex items-center text-sm font-medium text-muted-foreground">
                <Calendar className="w-4 h-4 mr-2" />
                Zaman Bilgisi
              </h3>
              
              <div className="text-sm">
                <div className="flex justify-between">
                  <span>Tarih:</span>
                  <span className="font-medium">{formattedDate}</span>
                </div>
                <div className="flex justify-between mt-1">
                  <span>Saat:</span>
                  <span className="font-medium">{appointment.startTime}</span>
                </div>
                <div className="flex justify-between mt-1">
                  <span>Personel:</span>
                  <span className="font-medium">{appointment.staff?.name || 'Tanımsız'}</span>
                </div>
              </div>
            </div>
            
            {/* Notlar varsa */}
            {appointment.notes && (
              <>
                <Separator />
                <div className="space-y-2">
                  <h3 className="flex items-center text-sm font-medium text-muted-foreground">
                    <Info className="w-4 h-4 mr-2" />
                    Notlar
                  </h3>
                  <p className="text-sm">{appointment.notes}</p>
                </div>
              </>
            )}
          </div>
          
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={onClose}>
              Kapat
            </Button>
            <Button variant="secondary" onClick={handleEdit}>
              Düzenle
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteClick}
              disabled={deleteAppointmentMutation.isPending}
            >
              Sil
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Silme onay modalı */}
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Randevu Silinecek</AlertDialogTitle>
            <AlertDialogDescription>
              Bu işlem geri alınamaz. Bu randevuyu silmek istediğinizden emin misiniz?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}