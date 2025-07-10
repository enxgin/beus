'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth.store';
import api from '@/lib/api';
import { toast } from 'sonner';
import {
  MoreHorizontal,
  PlusCircle,
  Calendar as CalendarIcon,
  Search,
  AlertCircle,
  Loader2,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
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
import { Badge } from '@/components/ui/badge';
import { UserRole } from '@prisma/client';

interface Appointment {
  id: string;
  customer: { name: string; phone: string };
  staff: { name: string };
  service: { name: string };
  startTime: string;
  endTime: string;
  status: string;
}

interface Branch {
  id: string;
  name: string;
}

const statusVariant: { [key: string]: 'default' | 'secondary' | 'destructive' | 'outline' } = {
  CONFIRMED: 'default',
  COMPLETED: 'secondary',
  CANCELLED: 'destructive',
  PENDING: 'outline',
};

export default function AppointmentsList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);

  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [appointmentToDelete, setAppointmentToDelete] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Hydration fix: Kullanıcı verisi yüklendiğinde doğru şubenin seçili olduğundan emin ol.
    if (user) {
      const branchIdFromUrl = searchParams.get('branchId');
      if (branchIdFromUrl) {
        setSelectedBranchId(branchIdFromUrl);
      } else if (
        user.branchId &&
        user.role !== UserRole.ADMIN &&
        user.role !== UserRole.SUPER_BRANCH_MANAGER
      ) {
        setSelectedBranchId(user.branchId);
      }
    }
  }, [user, searchParams]);

  // Debounce search term
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setPage(1); // Reset to first page on new search
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const canSelectBranch =
    user?.role === UserRole.ADMIN || user?.role === UserRole.SUPER_BRANCH_MANAGER;

  const { data: branches, isLoading: branchesLoading } = useQuery<Branch[]>({
    queryKey: ['branches'],
    queryFn: async () => {
      const response = await api.get('/branches', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    },
    enabled: !!token && canSelectBranch,
  });

  useEffect(() => {
    if (user) {
      if (canSelectBranch) {
        const branchIdFromUrl = searchParams.get('branchId');
        if (branchIdFromUrl) {
          setSelectedBranchId(branchIdFromUrl);
        }
      } else {
        setSelectedBranchId(user.branchId || null);
      }
      setIsReady(true);
    }
  }, [user, canSelectBranch, searchParams]);

  // Reset page when branch changes
  useEffect(() => {
    setPage(1);
  }, [selectedBranchId]);

  const { data, isLoading, isError, error } = useQuery<{ data: Appointment[]; totalCount: number }>(
    {
      queryKey: ['appointments', selectedBranchId, debouncedSearchTerm, page, limit],
      queryFn: async () => {
        const skip = (page - 1) * limit;
        const params = new URLSearchParams({
          skip: skip.toString(),
          take: limit.toString(),
        });
        if (selectedBranchId) params.append('branchId', selectedBranchId);
        if (debouncedSearchTerm) params.append('search', debouncedSearchTerm);

        const response = await api.get(`/appointments`, {
          params,
          headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
      },
      enabled: !!token && !!selectedBranchId && isReady,
      placeholderData: keepPreviousData,
    },
  );

  const handleBranchChange = (branchId: string) => {
    setSelectedBranchId(branchId);
    router.push(`/dashboard/appointments/list?branchId=${branchId}`);
  };

  const confirmDelete = async () => {
    if (!appointmentToDelete) return;
    try {
      await api.delete(`/appointments/${appointmentToDelete}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Randevu başarıyla silindi.');
      queryClient.invalidateQueries({ queryKey: ['appointments', selectedBranchId] });
      setAppointmentToDelete(null);
    } catch (err) {
      toast.error('Randevu silinirken bir hata oluştu.');
    }
  };

  const renderContent = () => {
    if (!isReady || (isLoading && !data)) {
      return (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }

    if (isError) {
      return (
        <div className="text-center py-10 text-red-500">
          <AlertCircle className="mx-auto h-8 w-8" />
          <p className="mt-2">Randevular yüklenirken bir hata oluştu.</p>
          <p className="text-sm text-muted-foreground">{(error as any)?.message || ''}</p>
        </div>
      );
    }

    if (!selectedBranchId && canSelectBranch) {
      return (
        <div className="text-center py-10">
          <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Şube Seçin</h3>
          <p className="mt-1 text-sm text-gray-500">
            Randevuları görüntülemek için lütfen bir şube seçin.
          </p>
        </div>
      );
    }

    if (!data || !data.data || data.data.length === 0) {
      return (
        <div className="text-center py-10">
          <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Randevu bulunamadı</h3>
          <p className="mt-1 text-sm text-gray-500">
            Seçili şube veya arama kriterleri için randevu bulunmamaktadır.
          </p>
        </div>
      );
    }

    return (
      <>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Müşteri</TableHead>
              <TableHead>Personel</TableHead>
              <TableHead>Hizmet</TableHead>
              <TableHead>Tarih ve Saat</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead>
                <span className="sr-only">İşlemler</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.data.map((appointment) => (
              <TableRow key={appointment.id}>
                <TableCell>
                  <div className="font-medium">{appointment.customer.name}</div>
                  <div className="text-sm text-muted-foreground">{appointment.customer.phone}</div>
                </TableCell>
                <TableCell>{appointment.staff.name}</TableCell>
                <TableCell>{appointment.service.name}</TableCell>
                <TableCell>
                  {new Date(appointment.startTime).toLocaleDateString('tr-TR')} -{' '}
                  {new Date(appointment.startTime).toLocaleTimeString('tr-TR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </TableCell>
                <TableCell>
                  <Badge variant={statusVariant[appointment.status] || 'outline'}>
                    {appointment.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button aria-haspopup="true" size="icon" variant="ghost">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Menüyü aç</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>İşlemler</DropdownMenuLabel>
                      <DropdownMenuItem
                        onClick={() =>
                          router.push(`/dashboard/appointments/edit/${appointment.id}`)
                        }
                      >
                        Düzenle
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setAppointmentToDelete(appointment.id)}
                        className="text-red-600"
                      >
                        Sil
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="flex items-center justify-between pt-4">
          <div className="text-sm text-muted-foreground">Toplam {data.totalCount} kayıt.</div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((old) => Math.max(old - 1, 1))}
              disabled={page === 1}
            >
              Önceki
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((old) => old + 1)}
              disabled={!data.totalCount || page * limit >= data.totalCount}
            >
              Sonraki
            </Button>
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard/appointments">Randevular</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem isCurrentPage>
              <BreadcrumbLink>Randevu Listesi</BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="flex items-center justify-between mt-2">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Randevular</h1>
            <p className="text-muted-foreground mt-1">
              Randevularınızı görüntüleyin ve yönetin.
            </p>
          </div>
          <Button
            onClick={() => router.push(`/dashboard/appointments/create?branchId=${selectedBranchId}`)}
            disabled={!selectedBranchId}
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            Yeni Randevu
          </Button>
        </div>
      </div>
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <CardTitle>Randevu Listesi</CardTitle>
            <div className="flex flex-col md:flex-row gap-2 md:ml-auto">
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Müşteri adı veya telefon ile ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full md:w-[200px] lg:w-[300px]"
                />
                <Search className="h-4 w-4 opacity-50" />
              </div>
              {canSelectBranch && (
                <Select
                  value={selectedBranchId || ''}
                  onValueChange={(value) => setSelectedBranchId(value || null)}
                >
                  <SelectTrigger className="w-full md:w-[200px]">
                    <SelectValue placeholder="Şube seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches?.map((branch: Branch) => (
                      <SelectItem key={branch.id} value={branch.id}>
                        {branch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>{renderContent()}</CardContent>
      </Card>

      <AlertDialog open={!!appointmentToDelete} onOpenChange={() => setAppointmentToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Randevuyu silmek istediğinize emin misiniz?</AlertDialogTitle>
            <AlertDialogDescription>
              Bu işlem geri alınamaz. Bu randevuyu kalıcı olarak silecektir.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
