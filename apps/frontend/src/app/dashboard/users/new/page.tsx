"use client";

import { UserForm } from "../[userId]/components/user-form";
import { useBranches } from "@/app/dashboard/branches/hooks/use-branches";
import { Skeleton } from "@/components/ui/skeleton";
import { UserRole } from "@/types/user";

// Statik rol tanımlamaları - RECEPTION rolünü de ekledik, müşteri rolü personel ekleme formunda kullanılmıyor
const roles = [
  { id: UserRole.ADMIN, name: 'Admin' },
  { id: UserRole.SUPER_BRANCH_MANAGER, name: 'Üst Şube Yöneticisi' },
  { id: UserRole.BRANCH_MANAGER, name: 'Şube Yöneticisi' },
  { id: UserRole.RECEPTION, name: 'Resepsiyon' },
  { id: UserRole.STAFF, name: 'Personel' },
];

export default function NewUserPage() {
  // Şubeleri al
  const { data: branchesData, isLoading: areBranchesLoading } = useBranches();

  if (areBranchesLoading) {
    return (
      <div className="flex-col">
        <div className="flex-1 space-y-4 p-8 pt-6">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    );
  }

  // Şubeleri `useBranches`'dan gelen formata göre ayarla
  const branches = branchesData || [];

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <UserForm 
          initialData={null} // Yeni kullanıcı oluşturulduğu için null
          roles={roles}
          branches={branches}
        />
      </div>
    </div>
  );
}