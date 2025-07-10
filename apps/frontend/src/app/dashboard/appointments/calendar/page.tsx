'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Card } from '@/components/ui/card';
import { CalendarView } from './components/calendar-view';
import { useAuthStore } from '@/stores/auth.store';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useBranches } from '@/hooks/use-branches';
import { UserRole } from '@/types/user';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { HomeIcon } from 'lucide-react';

export default function CalendarPage() {
  const { toast } = useToast();
  const { user } = useAuthStore();
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');

  // Şubeleri merkezi hook'tan getir
  const { data: branches, isLoading, isError } = useBranches(user);

  // Kullanıcı bilgisi yüklendiğinde ve seçili şube yoksa, kullanıcının kendi şubesini ata
  useEffect(() => {
    if (user?.branchId && !selectedBranchId) {
      setSelectedBranchId(user.branchId);
    }
  }, [user, selectedBranchId]);

  // Hata durumunda toast göster
  useEffect(() => {
    if (isError) {
      toast({
        title: "Hata",
        description: "Şube bilgileri yüklenirken bir hata oluştu.",
        variant: "destructive",
      });
    }
  }, [isError, toast]);

  const handleBranchChange = (value: string) => {
    setSelectedBranchId(value);
  };

  const canSelectBranch = user?.role === UserRole.ADMIN || user?.role === UserRole.SUPER_BRANCH_MANAGER;

  return (
    <div className="space-y-6">
      <div>
        <Breadcrumb>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard">
              <HomeIcon className="h-4 w-4" />
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard/appointments">Randevular</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem isCurrentPage>
            <BreadcrumbLink>Takvim</BreadcrumbLink>
          </BreadcrumbItem>
        </Breadcrumb>
        <h1 className="text-3xl font-bold tracking-tight mt-2">Randevu Takvimi</h1>
        <p className="text-muted-foreground mt-1">
          Tüm randevuları görüntüle ve yönet
        </p>
      </div>

      {canSelectBranch && branches && branches.length > 0 && (
        <div className="flex justify-end">
          <div className="w-full md:w-64">
            <Select
              value={selectedBranchId}
              onValueChange={handleBranchChange}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Şube Seç" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {branches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      <CalendarView branchId={selectedBranchId} />
    </div>
  );
}