"use client";

import { useParams } from "next/navigation";
import { UserForm } from "./components/user-form";
import { useUser } from "../hooks/use-users";
import { useBranches } from "@/app/dashboard/branches/hooks/use-branches";
import { Skeleton } from "@/components/ui/skeleton";

// Statik rol tanımlamaları - Türkçe rol isimleri kullanıldı ve UserRole enum'dan referans alındı
const roles = [
  { id: 'ADMIN', name: 'Admin' },
  { id: 'SUPER_BRANCH_MANAGER', name: 'Üst Şube Yöneticisi' },
  { id: 'BRANCH_MANAGER', name: 'Şube Yöneticisi' },
  { id: 'RECEPTION', name: 'Resepsiyon' },
  { id: 'STAFF', name: 'Personel' },
];

export default function UserPage() {
  const params = useParams();
  const userId = params.userId as string;

  // Güvenli hook'lar ile veri çekme
  const { data: user, isLoading: isUserLoading } = useUser(userId);
  const { data: branchesData, isLoading: areBranchesLoading } = useBranches();

  const isLoading = isUserLoading || areBranchesLoading;

  if (isLoading) {
    return (
      <div className="flex-col">
        <div className="flex-1 space-y-4 p-8 pt-6">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    );
  }

  // Şubeleri `useBranches`'dan gelen formata göre ayarla
  const branches = branchesData?.data || [];

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <UserForm 
          initialData={user || null}
          roles={roles}
          branches={branches}
        />
      </div>
    </div>
  );
}
