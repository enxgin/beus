'use client';

import { useEffect, useState, useMemo } from 'react';
import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth.store';
import api from '@/lib/api';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { UserRole } from '@/types/user';
import Link from 'next/link';
import { getCustomerPackagesWithStatus } from '../api';
import type { CustomerPackage as ImportedCustomerPackage, PackageService as ImportedPackageService } from '@/types';

// UI Bileşenleri
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Calendar, Search, AlertCircle, HomeIcon } from 'lucide-react';

// Sayfada kullanılacak sabit değerler
const PAGE_SIZE = 10;

// Tip tanımları
type Branch = {
  id: string;
  name: string;
};

type SoldPackageParams = {
  skip?: number;
  take?: number;
  searchTerm?: string;
  statusFilter?: string;
  branchId?: string;
  customerId?: string;
  useMockData?: boolean;
};

// Merkezi tiplerden import edilen tipleri kullanıyoruz
type CustomerPackage = ImportedCustomerPackage;
type PackageService = ImportedPackageService;

// Sayfa başlık bileşeni
function PageTitle() {
  return (
    <div className="space-y-6">
      <div>
        <Breadcrumb>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard">
              <HomeIcon className="h-4 w-4 mr-1" />
              Ana Sayfa
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard/packages">Paketler</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem isCurrentPage>
            <BreadcrumbLink>Satılan Paketler</BreadcrumbLink>
          </BreadcrumbItem>
        </Breadcrumb>
        <h1 className="text-3xl font-bold tracking-tight mt-2">Satılan Paketler</h1>
        <p className="text-muted-foreground mt-1">
          Müşterilere satılan tüm paketleri ve kullanım durumlarını görüntüleyin.
        </p>
      </div>
    </div>
  );
}

// API'den şubeleri çekmek için fonksiyon
async function fetchBranches(): Promise<Branch[]> {
  try {
    const token = useAuthStore.getState().token;
    const { data } = await api.get<Branch[]>('/branches', {
      headers: { Authorization: `Bearer ${token}` }
    });
    return data;
  } catch (error) {
    console.error("Şubeler yüklenemedi:", error);
    throw error;
  }
}

// API'den satılan paketleri çekmek için fonksiyon - yeni API ile
async function fetchSoldPackages(params: SoldPackageParams): Promise<CustomerPackage[]> {
  console.log('fetchSoldPackages çağrıldı, parametreler:', params);
  
  // Mock veri kullanılacaksa doğrudan mock veri döndür
  if (params.useMockData) {
    console.log('Mock veri kullanılıyor (istek üzerine)');
    return getMockPackages(params);
  }
  
  try {
    // Yeni API fonksiyonunu kullan
    const apiParams = {
      skip: params.skip,
      take: params.take,
      customerId: 'all', // Tüm müşterilerin paketlerini getir
      active: params.statusFilter === 'active' ? true : undefined
    };
    
    console.log('getCustomerPackagesWithStatus API çağrısı yapılıyor:', apiParams);
    
    const response = await getCustomerPackagesWithStatus(apiParams);
    let apiData = response.data;
    
    console.log('API yanıtı alındı, veri sayısı:', apiData.length);
    
    // Client-side filtreleme yap
    
    // Arama terimi varsa filtreleme yap
    if (params.searchTerm && params.searchTerm.trim() !== '') {
      const searchTerm = params.searchTerm.trim().toLowerCase();
      apiData = apiData.filter(pkg =>
        pkg.customer?.name?.toLowerCase().includes(searchTerm) ||
        pkg.package?.name?.toLowerCase().includes(searchTerm)
      );
    }
    
    // Şube filtrelemesi uygula
    if (params.branchId && params.branchId !== 'all') {
      // Şube filtrelemesi için şu anda bir özellik yok - daha sonra eklenecek
      // Backend bu özelliği desteklediğinde burası güncellenecek
    }
    
    // 'expired' durumu için filtreleme yap
    if (params.statusFilter === 'expired') {
      const now = new Date();
      apiData = apiData.filter(pkg => {
        if (!pkg.expiryDate) return false;
        const expiryDate = new Date(pkg.expiryDate);
        return expiryDate < now || !hasRemainingSessionsCheck(pkg);
      });
    }
    
    return apiData;
    
  } catch (error: any) {
    console.error('API Hatası:', error);
    
    // Hata durumunda mock veri dön
    console.log('Hata nedeniyle mock veriler kullanılıyor');
    return getMockPackages(params);
  }
}

// Mock veri oluşturan yardımcı fonksiyon
function getMockPackages(params: SoldPackageParams): CustomerPackage[] {
  const mockData: CustomerPackage[] = [
    {
      id: "1",
      customerId: "customer1",
      packageId: "package1",
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 30*24*60*60*1000).toISOString(),
      purchaseDate: new Date().toISOString(),
      expiryDate: new Date(Date.now() + 30*24*60*60*1000).toISOString(),
      remainingSessions: { "service1": 5, "service2": 3 },
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      customer: { id: "customer1", name: "Ahmet Yılmaz" },
      package: {
        id: "package1",
        name: "Deluxe Bakım Paketi",
        price: 500,
        validityDays: 30,
        type: "SESSION" as const,
        services: [
          {
            serviceId: "service1",
            quantity: 5,
            service: { id: "service1", name: "Yüz Bakımı", price: 100, duration: 60 }
          },
          {
            serviceId: "service2",
            quantity: 3,
            service: { id: "service2", name: "Masaj", price: 150, duration: 90 }
          }
        ]
      }
    },
    {
      id: "2",
      customerId: "customer2",
      packageId: "package2",
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 60*24*60*60*1000).toISOString(),
      purchaseDate: new Date().toISOString(),
      expiryDate: new Date(Date.now() + 60*24*60*60*1000).toISOString(),
      remainingSessions: { "service3": 8, "service4": 2 },
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      customer: { id: "customer2", name: "Ayşe Demir" },
      package: {
        id: "package2",
        name: "Premium Yüz Bakımı",
        price: 750,
        validityDays: 60,
        type: "SESSION" as const,
        services: [
          {
            serviceId: "service3",
            quantity: 8,
            service: { id: "service3", name: "Derin Yüz Bakımı", price: 200, duration: 120 }
          },
          {
            serviceId: "service4",
            quantity: 2,
            service: { id: "service4", name: "El Masajı", price: 80, duration: 45 }
          }
        ]
      }
    },
    {
      id: "3",
      customerId: "customer3",
      packageId: "package1",
      startDate: new Date(Date.now() - 60*24*60*60*1000).toISOString(),
      endDate: new Date(Date.now() - 1*24*60*60*1000).toISOString(),
      purchaseDate: new Date(Date.now() - 60*24*60*60*1000).toISOString(),
      expiryDate: new Date(Date.now() - 1*24*60*60*1000).toISOString(), // Süresi bitmiş
      remainingSessions: { "service1": 0, "service2": 0 },
      isActive: false,
      createdAt: new Date(Date.now() - 60*24*60*60*1000).toISOString(),
      updatedAt: new Date().toISOString(),
      customer: { id: "customer3", name: "Mehmet Kaya" },
      package: {
        id: "package1",
        name: "Deluxe Bakım Paketi",
        price: 500,
        validityDays: 30,
        type: "SESSION" as const,
        services: [
          {
            serviceId: "service1",
            quantity: 5,
            service: { id: "service1", name: "Yüz Bakımı", price: 100, duration: 60 }
          },
          {
            serviceId: "service2",
            quantity: 3,
            service: { id: "service2", name: "Masaj", price: 150, duration: 90 }
          }
        ]
      }
    }
  ];
  
  console.log('Mock veri kullanılıyor');
  
  // Client-side filtreleme yap
  let filteredData = [...mockData];
  
  // Arama terimi varsa filtreleme yap
  if (params.searchTerm && params.searchTerm.trim() !== '') {
    const searchTerm = params.searchTerm.trim().toLowerCase();
    filteredData = filteredData.filter(pkg => 
      pkg.customer?.name?.toLowerCase().includes(searchTerm) ||
      pkg.package?.name?.toLowerCase().includes(searchTerm)
    );
  }
  
  // Durum filtresi uygula
  if (params.statusFilter && params.statusFilter !== 'all') {
    if (params.statusFilter === 'active') {
      // Aktif paketleri filtrele
      const now = new Date();
      filteredData = filteredData.filter(pkg => {
        if (!pkg.expiryDate) return false;
        const expiryDate = new Date(pkg.expiryDate);
        return expiryDate >= now && hasRemainingSessionsCheck(pkg);
      });
    } else if (params.statusFilter === 'expired') {
      // Süresi dolmuş paketleri filtrele
      const now = new Date();
      filteredData = filteredData.filter(pkg => {
        if (!pkg.expiryDate) return false;
        const expiryDate = new Date(pkg.expiryDate);
        return expiryDate < now || !hasRemainingSessionsCheck(pkg);
      });
    }
  }
  
  // Şube filtrelemesi uygula
  if (params.branchId && params.branchId !== 'all') {
    // Şube filtrelemesi için şu anda bir özellik yok - daha sonra eklenecek
    // Tüm paketleri gösteriyoruz
  }
  
  // Pagination uygula (client-side)
  const skip = params.skip || 0;
  const take = params.take || 10;
  const paginatedData = filteredData.slice(skip, skip + take);
  
  return paginatedData;
}

// Kalan seans kontrolü
function hasRemainingSessionsCheck(pkg: CustomerPackage): boolean {
  if (!pkg.remainingSessions) return false;
  
  return Object.values(pkg.remainingSessions).some((count) => (count as number) > 0);
}

// Ana sayfa bileşeni
export default function SoldPackagesPage() {
  const user = useAuthStore(state => state.user);
  const token = useAuthStore(state => state.token);

  // State'ler
  const [currentPage, setCurrentPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedBranchId, setSelectedBranchId] = useState<string | undefined>();
  const [branches, setBranches] = useState<Branch[]>([]);
  
  // Sorgu parametreleri
  const queryParams = useMemo(() => {
    return {
      skip: currentPage * PAGE_SIZE,
      take: PAGE_SIZE,
      searchTerm,
      statusFilter,
      branchId: selectedBranchId,
    } as SoldPackageParams;
  }, [currentPage, searchTerm, statusFilter, selectedBranchId]);

  // Rol kontrolü için fonksiyon - kullanıcının bir şubeyle ilişkisi olup olmadığını kontrol eder
  const hasRoleForBranchSelection = () => {
    return user?.role === UserRole.ADMIN || user?.role === UserRole.SUPER_BRANCH_MANAGER;
  };

  // Şube seçimi için şube listesini yükleme
  const { data: branchesData, isLoading: branchesLoading } = useQuery<Branch[]>({
    queryKey: ['branches'],
    queryFn: fetchBranches,
    enabled: !!token && hasRoleForBranchSelection(), // Sadece Admin veya Super Branch Manager için şubeleri yükle
  });
  
  // Branches veri değişikliğini takip et ve state'i güncelle
  useEffect(() => {
    if (branchesData && branchesData.length > 0) {
      setBranches(branchesData);
    }
  }, [branchesData]);

  // Kullanıcı rolüne göre varsayılan şubeyi ayarla
  useEffect(() => {
    if (!user) return;
    
    // ADMIN ve SUPER_BRANCH_MANAGER için "all" olarak ayarla (tüm şubeler)
    if (user.role === UserRole.ADMIN) {
      setSelectedBranchId('all'); // Özel 'all' değeri
      return;
    }
    
    // SUPER_BRANCH_MANAGER için kendi şubesi veya "all" olabilir (sonra filtreleme seçeneği sunulacak)
    if (user.role === UserRole.SUPER_BRANCH_MANAGER) {
      setSelectedBranchId('all'); // Başlangıçta tümünü göster, kullanıcı filtreleyebilir
      return;
    }
    
    // Diğer roller (STAFF, BRANCH_MANAGER, RECEPTION) için kendi şubesini kullan
    if (user.branch?.id) {
      setSelectedBranchId(user.branch.id);
    } else if (user.branchId) {
      setSelectedBranchId(user.branchId);
    }
  }, [user]);

  // Satılan paketleri çekme - Typscript tip tanımlaması ile
  // Mock veri kullanılacak mı kontrolü
  const [useMockData, setUseMockData] = useState<boolean>(false);
  
  const { data: soldPackages = [], isLoading, isError, error } = useQuery<CustomerPackage[], Error>({
    queryKey: ['soldPackages', queryParams, useAuthStore.getState().token],
    queryFn: async () => {
      try {
        // API'den veri çekmeyi dene
        return await fetchSoldPackages(queryParams);
      } catch (error) {
        console.error('Paket verilerini çekerken hata:', error);
        // Hata durumunda mock veri dön
        setUseMockData(true);
        return getMockPackages(queryParams);
      }
    },
    staleTime: 1000 * 60 * 5, // 5 dakika
    enabled: !!useAuthStore.getState().token, // Token varsa sorguyu etkinleştir
    retry: 1, // Hata durumunda 1 kez yeniden dene
  });

  
  // API hatası durumunda mock veriye geç
  useEffect(() => {
    if (error) {
      console.log('API hatası nedeniyle mock veriye geçiliyor:', error);
      setUseMockData(true);
    }
  }, [error]);
  
  // Kalan seans kontrolü
  const hasRemainingSessions = (pkg: CustomerPackage) => {
    if (!pkg.remainingSessions) return false;
    
    return Object.values(pkg.remainingSessions).some((count) => count > 0);
  };

  // Paket durumunu belirleme - geliştirilmiş versiyon
  const getPackageStatus = (pkg: CustomerPackage) => {
    const now = new Date();
    if (!pkg.expiryDate) {
      return {
        label: "Tarih Bilgisi Yok",
        variant: "outline" as const,
        completionPercentage: 0
      };
    }
    const expiryDate = new Date(pkg.expiryDate);
    
    // Toplam seans sayısını ve kullanılan seans sayısını hesapla
    let totalSessions = 0;
    let remainingTotal = 0;
    
    if (pkg.remainingSessions) {
      Object.entries(pkg.remainingSessions).forEach(([serviceId, remaining]) => {
        if (pkg.package?.services) {
          const service = pkg.package.services.find((s: any) => s.service?.id === serviceId);
          if (service) {
            totalSessions += service.quantity || 0;
            remainingTotal += remaining;
          }
        }
      });
    }
    
    const usedSessions = totalSessions - remainingTotal;
    const completionPercentage = totalSessions > 0 ? Math.round((usedSessions / totalSessions) * 100) : 0;
    
    if (expiryDate < now) {
      return {
        label: "Süresi Dolmuş",
        variant: "destructive" as const,
        completionPercentage
      };
    } else if (remainingTotal === 0) {
      return {
        label: "Tamamlandı",
        variant: "secondary" as const,
        completionPercentage: 100
      };
    } else if (completionPercentage >= 75) {
      return {
        label: `Aktif (%${completionPercentage})`,
        variant: "outline" as const,
        completionPercentage
      };
    } else {
      return {
        label: `Aktif (%${completionPercentage})`,
        variant: "success" as const,
        completionPercentage
      };
    }
  };

  // Kalan seansları gösterme - geliştirilmiş versiyon
  const renderRemainingSessions = (pkg: CustomerPackage) => {
    const remainingSessions = pkg.remainingSessions;
    if (!remainingSessions) return "Veri yok";
    
    let totalRemaining = 0;
    let totalOriginal = 0;
    
    const sessionDetails = Object.entries(remainingSessions).map(([serviceId, remaining]) => {
      // Hizmet adını ve orijinal seans sayısını bul
      let serviceName = serviceId;
      let originalCount = remaining;
      
      if (pkg.package?.services) {
        const service = pkg.package.services.find((s: any) => s.service?.id === serviceId);
        if (service?.service?.name) {
          serviceName = service.service.name;
          originalCount = service.quantity || remaining;
        }
      }
      
      totalRemaining += remaining;
      totalOriginal += originalCount;
      const used = originalCount - remaining;
      
      return (
        <div key={serviceId} className="text-xs mb-1 flex justify-between items-center">
          <span className="font-medium">{serviceName}:</span>
          <div className="flex items-center gap-2">
            <span className={`${remaining > 0 ? 'text-green-600' : 'text-gray-500'}`}>
              {remaining}/{originalCount}
            </span>
            <div className="w-16 bg-gray-200 rounded-full h-1.5">
              <div
                className={`h-1.5 rounded-full ${remaining > 0 ? 'bg-green-500' : 'bg-gray-400'}`}
                style={{ width: `${originalCount > 0 ? (used / originalCount) * 100 : 0}%` }}
              ></div>
            </div>
          </div>
        </div>
      );
    });
    
    const completionPercentage = totalOriginal > 0 ? Math.round(((totalOriginal - totalRemaining) / totalOriginal) * 100) : 0;
    
    return (
      <div className="space-y-2">
        <div className="text-xs font-semibold text-gray-700 border-b pb-1">
          Toplam İlerleme: %{completionPercentage}
        </div>
        {sessionDetails}
      </div>
    );
  };

  // Arama işlemi için input handler
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    // Arama yaparken ilk sayfaya dön
    setCurrentPage(0);
  };

  // Yükleme durumu
  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageTitle />
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-full" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Hata durumu
  if (error) {
    return (
      <div className="space-y-6">
        <PageTitle />
        <Card>
          <CardHeader>
            <CardTitle className="text-red-500 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" /> Hata
            </CardTitle>
            <CardDescription>
              Satılan paketler yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-4 border border-red-200 rounded-md bg-red-50">
              <p className="text-red-800 text-sm">{(error as Error).message}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageTitle />

      {/* Filtreleme Barı */}
      <div className="flex flex-wrap gap-4">
        {/* Arama Kutusu */}
        <div className="flex-1 min-w-[250px]">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Müşteri veya paket adı ara..."
              value={searchTerm}
              onChange={handleSearch}
              className="pl-8 max-w-md"
            />
          </div>
        </div>

        {/* Şube Filtresi - Sadece Admin ve Super Branch Manager için göster */}
        {hasRoleForBranchSelection() && (
          <div>
            <Select 
              value={selectedBranchId || 'all'} 
              onValueChange={setSelectedBranchId}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Şubeyi Seçin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Şubeler</SelectItem>
                {branches?.map((branch) => (
                  <SelectItem key={branch.id} value={branch.id}>
                    {branch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Durum Filtresi */}
        <div>
          <Select 
            value={statusFilter} 
            onValueChange={setStatusFilter}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Durum Filtresi" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Paketler</SelectItem>
              <SelectItem value="active">Aktif Paketler</SelectItem>
              <SelectItem value="expired">Bitmiş Paketler</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Satılan Paketler Tablosu */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            <span>Satılan Paketler</span>
          </CardTitle>
          <CardDescription>Müşterilere satılan paketler ve kalan kullanım hakları</CardDescription>
        </CardHeader>
        <CardContent>
          {soldPackages && soldPackages.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Müşteri</TableHead>
                  <TableHead>Paket Adı</TableHead>
                  <TableHead>Satış Tarihi</TableHead>
                  <TableHead>Son Kullanım</TableHead>
                  <TableHead>Kalan Seanslar</TableHead>
                  <TableHead>Durum</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {soldPackages.map((pkg) => {
                  const status = getPackageStatus(pkg);
                  return (
                    <TableRow key={pkg.id}>
                      <TableCell className="font-medium">
                        {pkg.customer?.id ? (
                          <Link
                            href={`/dashboard/customers/${pkg.customer.id}`}
                            className="text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                          >
                            {pkg.customer.name || "Bilinmiyor"}
                          </Link>
                        ) : (
                          "Bilinmiyor"
                        )}
                      </TableCell>
                      <TableCell>
                        {pkg.package?.id ? (
                          <Link
                            href={`/dashboard/packages/${pkg.package.id}`}
                            className="text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                          >
                            {pkg.package.name || "Bilinmiyor"}
                          </Link>
                        ) : (
                          "Bilinmiyor"
                        )}
                      </TableCell>
                      <TableCell>
                        {pkg.purchaseDate ? format(new Date(pkg.purchaseDate), 'PP', { locale: tr }) : 'Tarih yok'}
                      </TableCell>
                      <TableCell>
                        {pkg.expiryDate ? format(new Date(pkg.expiryDate), 'PP', { locale: tr }) : 'Tarih yok'}
                      </TableCell>
                      <TableCell>
                        <div className="max-h-32 overflow-y-auto">
                          {renderRemainingSessions(pkg)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-10 flex flex-col items-center gap-2">
              <Search className="h-10 w-10 text-gray-300" />
              <p className="text-muted-foreground">Paket bulunamadı veya tüm paketler filtrelendi.</p>
            </div>
          )}

          {/* Sayfalama Butonları */}
          <div className="flex justify-between items-center mt-4">
            <Button 
              variant="outline" 
              onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
              disabled={currentPage === 0}
            >
              Önceki Sayfa
            </Button>
            <span className="text-sm text-muted-foreground">
              Sayfa {currentPage + 1}
            </span>
            <Button 
              variant="outline" 
              onClick={() => setCurrentPage(prev => prev + 1)}
              disabled={!soldPackages || soldPackages.length < PAGE_SIZE}
            >
              Sonraki Sayfa
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
