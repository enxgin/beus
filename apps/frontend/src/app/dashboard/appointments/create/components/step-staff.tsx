'use client';

import { useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { User, UserRole } from '@/lib/prisma-client';
import { AppointmentFormData } from './appointment-wizard';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface StepStaffProps {
  formData: AppointmentFormData;
  onSelectStaff: (staff: User) => void;
  selectedStaffId?: string;
}

// Backend'den gelen User tipi artık role alanını enum olarak içeriyor.
type StaffWithRole = User & { role: UserRole };

// Enum değerlerini kullanıcı dostu Türkçe ifadelere çeviren harita
const roleDisplayNames: Record<UserRole, string> = {
  ADMIN: 'Admin',
  SUPER_BRANCH_MANAGER: 'Bölge Sorumlusu',
  BRANCH_MANAGER: 'Şube Yöneticisi',
  RECEPTION: 'Resepsiyon',
  STAFF: 'Personel',
  CUSTOMER: 'Müşteri',
};

async function fetchStaff(branchId?: string, serviceId?: string): Promise<StaffWithRole[]> {
  if (!branchId || !serviceId) return [];
  const { data } = await api.get('/staff', { params: { branchId, serviceId } });
  return data;
}

export function StepStaff({ formData, onSelectStaff, selectedStaffId }: StepStaffProps) {
  const { data: staffList, isLoading } = useQuery<StaffWithRole[]>({
    queryKey: ['staff', formData.branchId, formData.service?.id],
    queryFn: () => fetchStaff(formData.branchId, formData.service?.id),
    enabled: !!formData.branchId && !!formData.service?.id,
  });

  useEffect(() => {
    if (selectedStaffId && staffList && !formData.staff) {
      const staffToSelect = staffList.find((s) => s.id === selectedStaffId);
      if (staffToSelect) {
        onSelectStaff(staffToSelect);
      }
    }
  }, [selectedStaffId, staffList, onSelectStaff, formData.staff]);

  const groupedStaff = useMemo(() => {
    if (!staffList) {
      return {};
    }
    return staffList.reduce((acc, staff) => {
      // Rol adını çeviri haritasından al, yoksa 'Diğer' olarak ata
      const roleName = roleDisplayNames[staff.role] || 'Diğer';
      if (!acc[roleName]) {
        acc[roleName] = [];
      }
      acc[roleName].push(staff);
      return acc;
    }, {} as Record<string, StaffWithRole[]>);
  }, [staffList]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Adım 2: Personel Seçimi</CardTitle>
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
                      formData.staff?.id === staff.id
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
