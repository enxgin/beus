"use client";

import { useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store'; // Düzeltilmiş import path

import { DataTable } from '@/components/ui/data-table';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { columns, UserColumn } from './columns';
import { useUsers } from '../hooks/use-users';

export const UsersClient = () => {
  const router = useRouter();
  const { data: usersResponse, isLoading, isError, error, refetch } = useUsers();
  const { user: currentUser, token, logout } = useAuthStore();

  // Token yoksa ve kullanıcı varsa - tutarsızlık durumunu tespit et ve oturumu sıfırla
  useEffect(() => {
    if (currentUser && !token) {
      console.warn('Oturum tutarsız durumda: Kullanıcı bilgileri var ama token yok. Oturum sıfırlanıyor...');
      logout(); // Auth state'i temizle
      setTimeout(() => {
        router.push('/login'); // Login sayfasına yönlendir
      }, 100);
    }
  }, [currentUser, token, logout, router]);

  // Kapsamlı debug logları
  useEffect(() => {
    console.log('AUTH STATE:', { 
      token, 
      currentUser, 
      isLoggedIn: !!token,
      userRole: currentUser?.role,
      userBranch: currentUser?.branchId,
    });
    
    console.log('USERS API STATE:', { 
      isLoading, 
      isError, 
      error, 
      hasData: !!usersResponse,
      dataFormat: usersResponse ? typeof usersResponse : 'none',
      responseData: usersResponse,
    });

    // 3 saniye sonra otomatik yeniden denemek için
    const timer = setTimeout(() => {
      if (!usersResponse && !isLoading) {
        console.log('Veri çekme başarısız. Yeniden deneniyor...');
        refetch();
      }
    }, 3000);
    
    return () => clearTimeout(timer);
  }, [usersResponse, isLoading, isError, token, currentUser, refetch]);

  const formattedUsers: UserColumn[] = useMemo(() => {
    console.log('FORMATTING USERS, RAW DATA:', usersResponse);
    
    if (!usersResponse) {
      console.log('usersResponse yok, boş dizi döndürülüyor');
      return [];
    }
    
    if (!usersResponse.data && Array.isArray(usersResponse)) {
      console.log('usersResponse bir dizi, doğrudan kullanılıyor:', usersResponse);
      return usersResponse.map((item) => ({
        id: item.id,
        name: item.name,
        email: item.email,
        branch: item.branch?.name || 'Atanmamış',
        role: item.role,
      }));
    }
    
    if (!usersResponse.data) {
      console.log('usersResponse.data yok, boş dizi döndürülüyor');
      return [];
    }

    console.log('usersResponse.data mevcut, dönüştürülüyor:', usersResponse.data);
    return usersResponse.data.map((item) => ({
      id: item.id,
      name: item.name,
      email: item.email,
      branch: item.branch?.name || 'Atanmamış',
      role: item.role,
    }));
  }, [usersResponse]);

  if (isError) {
    console.error('USER API HATA DETAYI:', error);
    return <div>
      <div>Personel verileri yüklenirken bir hata oluştu. Detaylar konsolda.</div>
      <Button onClick={() => refetch()} className="mt-4">
        Yeniden Dene
      </Button>
    </div>;
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <Heading
          title={`Personeller (${formattedUsers.length})`}
          description="Sistemdeki personelleri yönetin"
        />
        <Button onClick={() => router.push(`/dashboard/users/new`)}>
          <Plus className="mr-2 h-4 w-4" /> Personel Ekle
        </Button>
      </div>
      <Separator />
      <DataTable searchKey="name" columns={columns} data={formattedUsers} isLoading={isLoading} />
    </>
  );
};
