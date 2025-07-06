'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
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
import { Clock, Calendar, UserCircle, Info, Package, Phone, Mail, CheckCircle2 } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';

// Randevu durumları için enum
enum AppointmentStatus {
  SCHEDULED = 'SCHEDULED',
  COMPLETED = 'COMPLETED',
  CANCELED = 'CANCELED',
  PENDING = 'PENDING'
}

interface CustomerPackage {
  id: string;
  packageId: string;
  package: {
    id: string;
    name: string;
  };
  remainingSessions: Record<string, number>;
  expiryDate: string;
}

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
  const queryClient = useQueryClient();
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [status, setStatus] = useState<string>('');

  // Randevu durumunu değiştirme işlemi
  const updateStatusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      await axios.patch(`/appointments/${appointment.id}/status`, 
        { status: newStatus },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
    },
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "Randevu durumu başarıyla güncellendi",
      });
      onAppointmentUpdate();
      // Paket randevusu ve tamamlandı ise kalan seans sayısını güncellemek için
      if (appointment.customerPackageId) {
        queryClient.invalidateQueries({ queryKey: ['customerPackages'] });
      }
    },
    onError: (error) => {
      toast({
        title: "Hata",
        description: "Randevu durumu güncellenirken bir hata oluştu",
        variant: "destructive",
      });
      console.error('Randevu durum güncelleme hatası:', error);
    },
  });

  // Randevu silme işlemi
  const deleteAppointmentMutation = useMutation({
    mutationFn: async () => {
      await axios.delete(`/appointments/${appointment.id}`, {
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

  // Component mount olduğunda randevu durumunu state'e ata
  useEffect(() => {
    if (appointment?.status) {
      setStatus(appointment.status);
    }
    // Debug için randevu verilerini konsola yazdır
    console.log("Randevu detayları:", appointment);
  }, [appointment]);

  // Durum değiştiğinde API'yi çağır
  const handleStatusChange = (newStatus: string) => {
    setStatus(newStatus);
    updateStatusMutation.mutate(newStatus);
  };

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
  const formattedDate = appointment.startTime
    ? format(new Date(appointment.startTime), 'PPP', { locale: tr })
    : '';
    
  const formattedTime = appointment.startTime
    ? format(new Date(appointment.startTime), 'HH:mm', { locale: tr })
    : '';
    
  // Paket randevusu mu kontrol et
  const isPackageAppointment = !!appointment.customerPackageId;
  
  // Kalan seans sayısını hesapla
  const remainingSessions = isPackageAppointment && appointment.customerPackage?.remainingSessions
    ? appointment.customerPackage.remainingSessions[appointment.serviceId] || 0
    : null;

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
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Durum</h3>
                <Badge
                  variant={
                    status === AppointmentStatus.COMPLETED
                      ? 'success'
                      : status === AppointmentStatus.CANCELED
                      ? 'destructive'
                      : 'default'
                  }
                >
                  {status === AppointmentStatus.SCHEDULED && 'Planlandı'}
                  {status === AppointmentStatus.COMPLETED && 'Tamamlandı'}
                  {status === AppointmentStatus.CANCELED && 'İptal Edildi'}
                  {status === AppointmentStatus.PENDING && 'Beklemede'}
                </Badge>
              </div>
              
              {/* Durum değiştirme dropdown'u */}
              <div className="mt-2">
                <Select value={status} onValueChange={handleStatusChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Durum seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={AppointmentStatus.SCHEDULED}>Planlandı</SelectItem>
                    <SelectItem value={AppointmentStatus.COMPLETED}>Tamamlandı</SelectItem>
                    <SelectItem value={AppointmentStatus.CANCELED}>İptal Edildi</SelectItem>
                    <SelectItem value={AppointmentStatus.PENDING}>Beklemede</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />
            
            {/* Müşteri bilgileri */}
            <div className="space-y-2">
              <h3 className="flex items-center text-sm font-medium text-muted-foreground">
                <UserCircle className="w-4 h-4 mr-2" />
                Müşteri Bilgileri
              </h3>
              
              <div className="text-sm">
                <p className="font-medium">
                  {appointment.customer?.name || 'İsimsiz Müşteri'}
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
            
            {/* Hizmet bilgisi veya Paket bilgisi */}
            {isPackageAppointment ? (
              <div className="space-y-2">
                <h3 className="flex items-center text-sm font-medium text-muted-foreground">
                  <Package className="w-4 h-4 mr-2" />
                  Paket Bilgileri
                </h3>
                
                <Card className="border border-green-200 bg-green-50">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-green-800">
                          {appointment.customerPackage?.package?.name || 'Paket'}
                        </p>
                        <p className="text-sm text-green-700 mt-1">
                          {appointment.service?.name || 'Hizmet'}
                        </p>
                      </div>
                      <Badge variant="outline" className="bg-white border-green-300">
                        Kalan: {remainingSessions !== null ? remainingSessions : '?'} Seans
                      </Badge>
                    </div>
                    
                    <div className="flex items-center text-sm text-green-700 mt-1">
                      <Clock className="w-3 h-3 mr-1" />
                      <span>{appointment.duration || appointment.service?.duration || '?'} dakika</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
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
                      <span>{appointment.duration || appointment.service?.duration || '?'} dakika</span>
                    </div>
                    <div className="font-medium">
                      {appointment.service?.price ? `${appointment.service.price.toFixed(2)} ₺` : '-'}
                    </div>
                  </div>
                </div>
              </div>
            )}
            
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
                  <span className="font-medium">{formattedTime}</span>
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