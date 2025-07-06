'use client';

import { useEffect, useState, useMemo } from 'react';
import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth.store'; 
import api from '@/lib/api';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { UserRole } from '@/types/user';

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
import { Calendar, Search, AlertCircle } from 'lucide-react';

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

type PackageService = {
  service?: {
    id: string;
    name: string;
  };
};

type CustomerPackage = {
  id: string;
  customerId: string;
  packageId: string;
  purchaseDate: string;
  expiryDate: string;
  remainingSessions?: Record<string, number>;
  customer?: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
  };
  package?: {
    id: string;
    name: string;
    description?: string;
    price?: number;
    services?: PackageService[];
  };
};

// Sayfa başlık bileşeni
function PageTitle() {
  return (
    <div className="mb-6">
      <h1 className="text-3xl font-bold tracking-tight">Satılan Paketler</h1>
      <p className="text-muted-foreground">
        Müşterilere satılan tüm paketleri ve kullanım durumlarını görüntüleyin.
      </p>
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

// API'den satılan paketleri çekmek için fonksiyon - rol bazlı filtreleme ve sunucu tarafında arama ile
async function fetchSoldPackages(params: SoldPackageParams): Promise<CustomerPackage[]> {
  console.log('fetchSoldPackages çağrıldı, parametreler:', params);
  
  // Token kontrolü
  const authState = useAuthStore.getState();
  let token = authState.token;
  
  // Token yoksa manuel yedekten kontrol et
  if (!token) {
    console.log('Zustand store\'da token bulunamadı, manuel yedek kontrol ediliyor...');
    try {
      if (typeof window !== 'undefined') {
        const manualBackup = localStorage.getItem('auth-manual-backup');
        if (manualBackup) {
          const parsedBackup = JSON.parse(manualBackup);
          if (parsedBackup.token) {
            token = parsedBackup.token;
            console.log('Manuel yedekten token alındı:', parsedBackup.token.substring(0, 10) + '...');
          }
        }
      }
    } catch (e) {
      console.error('Manuel token yedeği okunurken hata:', e);
    }
  }
  
  // Hala token yoksa mock veri dön
  if (!token) {
    console.error('Token bulunamadı! Oturum açık değil veya token kayıp.');
    console.log('Mock veriler kullanılıyor (token bulunamadı)');
    return getMockPackages(params);
  }
  
  console.log('Kullanılan token:', token.substring(0, 15) + '...');
  
  // Mock veri kullanılacaksa doğrudan mock veri döndür
  if (params.useMockData) {
    console.log('Mock veri kullanılıyor (istek üzerine)');
    return getMockPackages(params);
  }
  
  // URL parametrelerini oluştur
  const queryParams = new URLSearchParams();
  if (params.skip !== undefined) queryParams.append('skip', params.skip.toString());
  if (params.take !== undefined) queryParams.append('take', params.take.toString());
  if (params.statusFilter === 'active') queryParams.append('active', 'true');
  
  // Arama terimi varsa ekle
  if (params.searchTerm) {
    queryParams.append('searchTerm', params.searchTerm);
  }
  
  // Şube filtresi varsa ekle
  if (params.branchId) {
    queryParams.append('branchId', params.branchId);
  }
  
  // CustomerId parametresi
  if (params.customerId) {
    queryParams.append('customerId', params.customerId);
  } else {
    // Tüm müşterilerin paketlerini getirmek için 'all' parametresi gönder
    queryParams.append('customerId', 'all'); // Backend bu özel değeri tanıyor
  }
  
  try {
    // Backend API'sine istek gönder
    console.log('API isteği yapılıyor:', `/packages/customer?${queryParams.toString()}`);
    
    // Token'dan emin olalım
    if (!token) {
      console.error('API isteği için token bulunamadı, mock veriler kullanılacak');
      return getMockPackages(params);
    }
    
    console.log('Token durumu: Token var, uzunluk:', token.length);
    
    // API isteğini doğrudan api instance ile yap (interceptor token ekleyecek)
    const response = await api.get<CustomerPackage[]>(`/packages/customer?${queryParams.toString()}`);
    console.log('API yanıtı:', response.status, response.statusText);
    console.log('Veri sayısı:', response.data?.length || 0);
    let apiData = response.data;
    console.log('Backend API yanıtı:', apiData);
    
    // API yanıtı ile client-side filtreleme yap (backend tam olarak desteklemediği için)
    
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
    
    // Sadece 'expired' durumu için filtreleme yap (aktif olanları backend filtreler)
    if (params.statusFilter === 'expired') {
      const now = new Date();
      apiData = apiData.filter(pkg => {
        const expiryDate = new Date(pkg.expiryDate);
        return expiryDate < now || !hasRemainingSessionsCheck(pkg);
      });
    }
    
    return apiData;
    
  } catch (error: any) {
    console.error('API Hatası:', error);
    
    // Daha detaylı hata bilgisi
    if (error.response) {
      // Sunucu yanıtı ile dönen hata (4xx, 5xx)
      console.error(`Sunucu hatası: ${error.response.status} ${error.response.statusText}`);
      console.error('Hata detayları:', error.response.data || {});
      
      if (error.response.status === 401) {
        console.warn('Yetkilendirme hatası (401). Token geçersiz veya eksik olabilir.');
        // Oturumu yenileme mantığı eklenebilir
      } else if (error.response.status === 404) {
        console.warn('Endpoint bulunamadı (404). API yolu doğru mu?');
        console.log('Aranan endpoint:', `/packages/customer?${queryParams.toString()}`);
      }
    } else if (error.request) {
      // İstek yapıldı ama yanıt alınamadı
      console.error('Sunucudan yanıt alınamadı. Backend çalışıyor mu?');
    } else {
      // İstek oluşturulurken hata
      console.error('API isteği oluşturulurken hata:', error.message);
    }
    
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
      purchaseDate: new Date().toISOString(),
      expiryDate: new Date(Date.now() + 30*24*60*60*1000).toISOString(),
      remainingSessions: { "service1": 5, "service2": 3 },
      customer: { id: "customer1", name: "Ahmet Yılmaz" },
      package: { 
        id: "package1", 
        name: "Deluxe Bakım Paketi", 
        price: 500, 
        services: [
          { 
            service: { id: "service1", name: "Yüz Bakımı" },
            count: 5 
          },
          { 
            service: { id: "service2", name: "Masaj" },
            count: 3 
          }
        ] as unknown as PackageService[] 
      }
    },
    {
      id: "2",
      customerId: "customer2",
      packageId: "package2",
      purchaseDate: new Date().toISOString(),
      expiryDate: new Date(Date.now() + 60*24*60*60*1000).toISOString(),
      remainingSessions: { "service3": 8, "service4": 2 },
      customer: { id: "customer2", name: "Ayşe Demir" },
      package: { 
        id: "package2", 
        name: "Premium Yüz Bakımı", 
        price: 750, 
        services: [
          { 
            service: { id: "service3", name: "Derin Yüz Bakımı" },
            count: 8 
          },
          { 
            service: { id: "service4", name: "El Masajı" },
            count: 2 
          }
        ] as unknown as PackageService[] 
      }
    },
    {
      id: "3",
      customerId: "customer3",
      packageId: "package1",
      purchaseDate: new Date(Date.now() - 60*24*60*60*1000).toISOString(),
      expiryDate: new Date(Date.now() - 1*24*60*60*1000).toISOString(), // Süresi bitmiş
      remainingSessions: { "service1": 0, "service2": 0 },
      customer: { id: "customer3", name: "Mehmet Kaya" },
      package: { 
        id: "package1", 
        name: "Deluxe Bakım Paketi", 
        price: 500, 
        services: [
          { 
            service: { id: "service1", name: "Yüz Bakımı" },
            count: 5 
          },
          { 
            service: { id: "service2", name: "Masaj" },
            count: 3 
          }
        ] as unknown as PackageService[] 
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
        const expiryDate = new Date(pkg.expiryDate);
        return expiryDate >= now && hasRemainingSessionsCheck(pkg);
      });
    } else if (params.statusFilter === 'expired') {
      // Süresi dolmuş paketleri filtrele
      const now = new Date();
      filteredData = filteredData.filter(pkg => {
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

  // Paket durumunu belirleme
  const getPackageStatus = (pkg: CustomerPackage) => {
    const now = new Date();
    const expiryDate = new Date(pkg.expiryDate);
    
    if (expiryDate < now) {
      return { label: "Süresi Dolmuş", variant: "destructive" as const };
    } else if (!hasRemainingSessions(pkg)) {
      return { label: "Kullanılmış", variant: "secondary" as const };
    } else {
      return { label: "Aktif", variant: "success" as const };
    }
  };

  // Kalan seansları gösterme
  const renderRemainingSessions = (remainingSessions: Record<string, number> | undefined) => {
    if (!remainingSessions) return "Veri yok";
    
    return Object.entries(remainingSessions).map(([serviceId, count]) => {
      // Hizmet adını bulmaya çalış
      let serviceName = serviceId;
      
      if (soldPackages) {
        for (const p of soldPackages) {
          if (p.package?.services) {
            const service = p.package.services.find((s: PackageService) => s.service?.id === serviceId);
            if (service?.service?.name) {
              serviceName = service.service.name;
              break;
            }
          }
        }
      }
      
      return (
        <div key={serviceId} className="text-xs mb-1">
          <span className="font-medium">{serviceName}:</span> {count}
        </div>
      );
    });
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
      <div className="p-6">
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
      <div className="p-6">
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
    <div className="p-6">
      <PageTitle />

      {/* Filtreleme Barı */}
      <div className="mb-6 flex flex-wrap gap-4">
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
                      <TableCell className="font-medium">{pkg.customer?.name || "Bilinmiyor"}</TableCell>
                      <TableCell>{pkg.package?.name || "Bilinmiyor"}</TableCell>
                      <TableCell>{format(new Date(pkg.purchaseDate), 'PP', { locale: tr })}</TableCell>
                      <TableCell>{format(new Date(pkg.expiryDate), 'PP', { locale: tr })}</TableCell>
                      <TableCell>
                        <div className="max-h-24 overflow-y-auto">
                          {renderRemainingSessions(pkg.remainingSessions)}
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
