'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import Link from 'next/link';

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
  branchId: string;
  branch: {
    id: string;
    name: string;
  };
  startTime: string;
  endTime: string;
  duration: number;
  status: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export default function AppointmentViewPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const appointmentId = params.id as string;
  const branchId = searchParams.get('branchId') || '';

  // Randevu detaylarını getir
  const { data: appointment, isLoading, error } = useQuery<Appointment>({
    queryKey: ['appointment', appointmentId],
    queryFn: async () => {
      const { data } = await api.get(`/appointments/${appointmentId}`);
      return data;
    },
    enabled: !!appointmentId,
  });

  // Randevu silme işlemi
  const handleDeleteAppointment = async () => {
    if (confirm('Bu randevuyu silmek istediğinize emin misiniz?')) {
      try {
        await api.delete(`/appointments/${appointmentId}`);
        alert('Randevu başarıyla silindi.');
        router.push(`/dashboard/appointments/list?branchId=${branchId}`);
      } catch (error) {
        console.error('Randevu silinirken hata oluştu:', error);
        alert('Randevu silinirken bir hata oluştu.');
      }
    }
  };

  // Randevu durumunu güncelleme
  const handleUpdateStatus = async (newStatus: string) => {
    try {
      await api.patch(`/appointments/${appointmentId}`, { status: newStatus });
      alert(`Randevu durumu "${newStatus}" olarak güncellendi.`);
      router.refresh();
    } catch (error) {
      console.error('Randevu durumu güncellenirken hata oluştu:', error);
      alert('Randevu durumu güncellenirken bir hata oluştu.');
    }
  };

  // Tarih ve saat formatla
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('tr-TR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="bg-white rounded-lg border shadow-sm p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !appointment) {
    return (
      <div className="container mx-auto py-6">
        <div className="bg-white rounded-lg border shadow-sm p-6">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Hata</h1>
          <p className="mb-4">Randevu bilgileri yüklenirken bir hata oluştu.</p>
          <Link 
            href={`/dashboard/appointments/list?branchId=${branchId}`}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
          >
            Randevu Listesine Dön
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Randevu Detayları</h1>
          <p className="text-gray-500">ID: {appointment.id}</p>
        </div>
        <div className="flex gap-2">
          <Link 
            href={`/dashboard/appointments/list?branchId=${branchId}`}
            className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-md"
          >
            Listeye Dön
          </Link>
          <Link 
            href={`/dashboard/appointments/edit/${appointmentId}?branchId=${branchId}`}
            className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-md"
          >
            Düzenle
          </Link>
          <button 
            onClick={handleDeleteAppointment}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md"
          >
            Sil
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg border shadow-sm">
        {/* Durum bilgisi ve durum değiştirme */}
        <div className="p-4 border-b flex justify-between items-center">
          <div className="flex items-center">
            <span className="font-semibold mr-2">Durum:</span>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              appointment.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
              appointment.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
              'bg-blue-100 text-blue-800'
            }`}>
              {appointment.status === 'COMPLETED' ? 'Tamamlandı' :
               appointment.status === 'CANCELLED' ? 'İptal Edildi' :
               'Bekliyor'}
            </span>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => handleUpdateStatus('PENDING')}
              className="bg-blue-100 hover:bg-blue-200 text-blue-800 px-3 py-1 rounded-md text-sm"
              disabled={appointment.status === 'PENDING'}
            >
              Bekliyor
            </button>
            <button 
              onClick={() => handleUpdateStatus('COMPLETED')}
              className="bg-green-100 hover:bg-green-200 text-green-800 px-3 py-1 rounded-md text-sm"
              disabled={appointment.status === 'COMPLETED'}
            >
              Tamamlandı
            </button>
            <button 
              onClick={() => handleUpdateStatus('CANCELLED')}
              className="bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded-md text-sm"
              disabled={appointment.status === 'CANCELLED'}
            >
              İptal Et
            </button>
          </div>
        </div>

        {/* Randevu detayları */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">Randevu Bilgileri</h2>
            
            <div>
              <p className="text-gray-500 text-sm">Şube</p>
              <p className="font-medium">{appointment.branch?.name || 'Belirtilmemiş'}</p>
            </div>
            
            <div>
              <p className="text-gray-500 text-sm">Başlangıç Zamanı</p>
              <p className="font-medium">{formatDateTime(appointment.startTime)}</p>
            </div>
            
            <div>
              <p className="text-gray-500 text-sm">Bitiş Zamanı</p>
              <p className="font-medium">{formatDateTime(appointment.endTime)}</p>
            </div>
            
            <div>
              <p className="text-gray-500 text-sm">Süre</p>
              <p className="font-medium">{appointment.duration} dakika</p>
            </div>
            
            <div>
              <p className="text-gray-500 text-sm">Hizmet</p>
              <p className="font-medium">{appointment.service.name}</p>
            </div>
            
            <div>
              <p className="text-gray-500 text-sm">Fiyat</p>
              <p className="font-medium">{appointment.service.price} TL</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">Kişi Bilgileri</h2>
            
            <div>
              <p className="text-gray-500 text-sm">Müşteri</p>
              <p className="font-medium">{appointment.customer.name}</p>
            </div>
            
            <div>
              <p className="text-gray-500 text-sm">Telefon</p>
              <p className="font-medium">{appointment.customer.phone}</p>
            </div>
            
            <div>
              <p className="text-gray-500 text-sm">E-posta</p>
              <p className="font-medium">{appointment.customer.email || 'Belirtilmemiş'}</p>
            </div>
            
            <div>
              <p className="text-gray-500 text-sm">Personel</p>
              <p className="font-medium">{appointment.staff.name}</p>
            </div>
            
            <div>
              <p className="text-gray-500 text-sm">Notlar</p>
              <p className="font-medium">{appointment.notes || 'Not bulunmuyor'}</p>
            </div>
          </div>
        </div>
        
        {/* Oluşturulma ve güncellenme bilgileri */}
        <div className="p-4 border-t bg-gray-50 text-sm text-gray-500">
          <p>Oluşturulma: {formatDateTime(appointment.createdAt)}</p>
          <p>Son Güncelleme: {formatDateTime(appointment.updatedAt)}</p>
        </div>
      </div>
    </div>
  );
}
