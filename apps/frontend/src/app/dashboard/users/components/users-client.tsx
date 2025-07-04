"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';

import { DataTable } from '@/components/ui/data-table';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { columns, UserColumn } from './columns';
import { User } from '@/types/user';

export const UsersClient = () => {
  const router = useRouter();
  const [users, setUsers] = useState<UserColumn[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await api.get('/users');
        console.log('API Response:', response);
        
        // Backend UsersService.findAll returns { data: users[], meta: { total } }
        // Extract the users array from the correct location
        let userData: User[] = [];
        
        if (Array.isArray(response.data)) {
          // Direct array format
          userData = response.data;
        } else if (response.data?.data && Array.isArray(response.data.data)) {
          // Nested data property (this is what our backend actually returns)
          userData = response.data.data;
        } else if (response.data?.items && Array.isArray(response.data.items)) {
          // Paginated format with items property
          userData = response.data.items;
        } else if (response.data) {
          // Last resort fallback
          userData = [response.data].flat();
        }
        
        console.log('Extracted User Data:', userData);
        const formattedUsers: UserColumn[] = userData.map((item) => ({
          id: item.id,
          name: item.name,
          email: item.email,
          branch: item.branch?.name || 'Atanmamış',
          role: item.role,
        }));
        setUsers(formattedUsers);
      } catch (error) {
        console.error('Personel verileri çekilirken bir hata oluştu:', error);
        // Burada kullanıcıya bir hata mesajı gösterilebilir (örn: toast notification)
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  return (
    <>
      <div className="flex items-center justify-between">
        <Heading
          title={`Personeller (${users.length})`}
          description="Sistemdeki personelleri yönetin"
        />
        <Button onClick={() => router.push(`/dashboard/users/new`)}>
          <Plus className="mr-2 h-4 w-4" /> Personel Ekle
        </Button>
      </div>
      <Separator />
      <DataTable searchKey="name" columns={columns} data={users} isLoading={loading} />
    </>
  );
};
