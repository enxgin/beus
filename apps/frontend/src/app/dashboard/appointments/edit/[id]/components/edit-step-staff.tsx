'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

// Prisma'dan gelen tiplerle uyumlu olmalı
enum UserRole {
  ADMIN = 'ADMIN',
  SUPER_BRANCH_MANAGER = 'SUPER_BRANCH_MANAGER',
  BRANCH_MANAGER = 'BRANCH_MANAGER',
  RECEPTION = 'RECEPTION',
  STAFF = 'STAFF',
  CUSTOMER = 'CUSTOMER',
}

interface User {
  id: string;
  name: string;
  role: UserRole;
  // Gerekirse diğer alanlar eklenebilir
}

interface EditStepStaffProps {
  branchId: string;
  serviceId: string | undefined;
  selectedStaff: User | null;
  onSelectStaff: (staff: User) => void;
}

const roleDisplayNames: Record<UserRole, string> = {
  ADMIN: 'Admin',
  SUPER_BRANCH_MANAGER: 'Bölge Sorumlusu',
  BRANCH_MANAGER: 'Şube Yöneticisi',
  RECEPTION: 'Resepsiyon',
  STAFF: 'Personel',
  CUSTOMER: 'Müşteri',
};

async function fetchStaff(branchId: string, serviceId?: string): Promise<User[]> {
  if (!serviceId) return [];
  const { data } = await api.get('/staff', { params: { branchId, serviceId } });
  return data;
}

export function EditStepStaff({ branchId, serviceId, selectedStaff, onSelectStaff }: EditStepStaffProps) {
  const { data: staffList, isLoading } = useQuery<User[]>({
    queryKey: ['staff', branchId, serviceId],
    queryFn: () => fetchStaff(branchId, serviceId),
    enabled: !!branchId && !!serviceId,
  });

  const groupedStaff = useMemo(() => {
    if (!staffList) return {};
    return staffList.reduce((acc, staff) => {
      const roleName = roleDisplayNames[staff.role] || 'Diğer';
      if (!acc[roleName]) {
        acc[roleName] = [];
      }
      acc[roleName].push(staff);
      return acc;
    }, {} as Record<string, User[]>);
  }, [staffList]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Personel Seçimi</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {isLoading &&
            Array.from({ length: 2 }).map((_, i) => (
              <div key={i}>
                <Skeleton className="h-6 w-1/3 mb-4" />
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {Array.from({ length: 4 }).map((_, j) => (
                    <Skeleton key={j} className="h-28 w-full" />
                  ))}
                </div>
              </div>
            ))}

          {Object.entries(groupedStaff).map(([role, staffInRole]) => (
            <div key={role}>
              <h4 className="text-lg font-semibold mb-3 border-b pb-2 text-muted-foreground">
                {role}
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {staffInRole.map((staff) => (
                  <div
                    key={staff.id}
                    onClick={() => onSelectStaff(staff)}
                    className={`p-4 border rounded-lg cursor-pointer transition-all flex flex-col items-center justify-center text-center ${
                      selectedStaff?.id === staff.id
                        ? 'border-primary ring-2 ring-primary shadow-lg'
                        : 'border-border hover:border-primary/50'
                    }`}>
                    <Avatar className="w-16 h-16 mb-2">
                      <AvatarFallback>{staff.name?.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <h3 className="font-semibold">{staff.name}</h3>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {!isLoading && staffList?.length === 0 && (
            <p className="col-span-full text-center text-muted-foreground">
              Bu hizmeti verebilecek uygun personel bulunamadı.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
