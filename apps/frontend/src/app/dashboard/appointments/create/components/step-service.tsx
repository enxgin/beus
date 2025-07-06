'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Service } from '@/lib/prisma-client';
import { AppointmentFormData } from './appointment-wizard';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

interface CustomerPackage {
  id: string;
  packageId: string;
  package: {
    id: string;
    name: string;
    services: {
      id: string;
      serviceId: string;
      service: Service;
      sessions: number;
    }[];
  };
  remainingSessions: Record<string, number>;
  expiryDate: string;
}

interface StepServiceProps {
  formData: AppointmentFormData;
  onSelectService: (service: Service, customerPackageId?: string, packageServiceId?: string) => void;
}

async function fetchServices(branchId?: string): Promise<Service[]> {
  if (!branchId) return [];
  // API artık { data: Service[], totalCount: number } formatında bir nesne döndürüyor
  // ve tüm hizmetleri getirmek için 'take' parametresi gerekiyor.
  const { data } = await api.get('/services', { params: { branchId, take: 1000 } });
  return data.data; // Dönen nesnenin içindeki 'data' dizisini döndür
}

async function fetchCustomerPackages(customerId?: string): Promise<CustomerPackage[]> {
  if (!customerId) return [];
  try {
    const { data } = await api.get(`/packages/customer`, {
      params: {
        customerId: customerId,
        active: true,
      },
    });
    return data;
  } catch (error) {
    console.error('Müşteri paketleri getirilirken hata:', error);
    return [];
  }
}

export function StepService({ formData, onSelectService }: StepServiceProps) {
  const [activeTab, setActiveTab] = useState<string>('services');

  const { data: services, isLoading: isLoadingServices } = useQuery<Service[]>({
    queryKey: ['services', formData.branchId],
    queryFn: () => fetchServices(formData.branchId),
    enabled: !!formData.branchId,
  });

  const { data: customerPackages, isLoading: isLoadingPackages } = useQuery<CustomerPackage[]>({
    queryKey: ['customerPackages', formData.customer?.id],
    queryFn: () => fetchCustomerPackages(formData.customer?.id),
    enabled: !!formData.customer?.id,
  });

  // Paket hizmeti seçme fonksiyonu
  const handlePackageServiceSelect = (customerPackage: CustomerPackage, packageService: any) => {
    // Kalan seans sayısını kontrol et
    const remainingSessions = customerPackage.remainingSessions[packageService.serviceId] || 0;
    if (remainingSessions <= 0) return; // Kalan seans yoksa seçilemez
    
    // Paket hizmetini seçerken, hizmet bilgisini, müşteri paketi ID'sini ve paket hizmeti ID'sini iletiyoruz
    console.log('Paket hizmeti seçildi:', {
      service: packageService.service,
      customerPackageId: customerPackage.id,
      packageServiceId: packageService.id,
      serviceId: packageService.serviceId
    });
    
    onSelectService(packageService.service, customerPackage.id, packageService.serviceId);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Adım 2: Hizmet/Paket Seçimi</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2 mb-6">
            <TabsTrigger value="services">Normal Hizmetler</TabsTrigger>
            <TabsTrigger value="packages">Müşteri Paketleri</TabsTrigger>
          </TabsList>
          
          <TabsContent value="services">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {isLoadingServices && Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
              {services?.map((service) => (
                <div
                  key={service.id}
                  onClick={() => onSelectService(service)}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    formData.service?.id === service.id && !formData.customerPackageId
                      ? 'border-primary ring-2 ring-primary'
                      : 'border-border'
                  }`}>
                  <h3 className="font-semibold">{service.name}</h3>
                  <p className="text-sm text-muted-foreground">{service.duration} dk</p>
                  <p className="text-sm font-medium">{service.price} TL</p>
                </div>
              ))}
              {services?.length === 0 && !isLoadingServices && (
                <div className="col-span-full text-center py-8 text-muted-foreground">
                  <p>Kayıtlı hizmet bulunamadı</p>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="packages">
            {!formData.customer && (
              <div className="text-center py-8 text-muted-foreground">
                <p>Müşteri paketlerini görmek için önce müşteri seçimi yapmalısınız.</p>
              </div>
            )}
            
            {formData.customer && isLoadingPackages && (
              <div className="space-y-4">
                {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}
              </div>
            )}
            
            {formData.customer && !isLoadingPackages && customerPackages?.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <p>Müşteriye ait aktif paket bulunamadı</p>
              </div>
            )}
            
            {formData.customer && customerPackages && customerPackages.length > 0 && (
              <div className="space-y-6">
                {customerPackages.map((customerPackage, index) => (
                  <div key={`${customerPackage.id}-${index}`} className="border rounded-lg p-4">
                    <h3 className="font-semibold text-lg mb-2">{customerPackage.package.name}</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Son kullanma: {new Date(customerPackage.expiryDate).toLocaleDateString()}
                    </p>
                    
                    <h4 className="font-medium mb-2">Paket Hizmetleri:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {customerPackage.package.services.map((packageService) => {
                        const remainingCount = customerPackage.remainingSessions[packageService.serviceId] || 0;
                        return (
                          <div
                            key={`${customerPackage.id}-${packageService.id}`}
                            onClick={() => handlePackageServiceSelect(customerPackage, packageService)}
                            className={`p-3 border rounded-lg cursor-pointer ${remainingCount <= 0 ? 'opacity-50 cursor-not-allowed' : ''} ${
                              formData.customerPackageId === customerPackage.id && 
                              formData.packageServiceId === packageService.id
                                ? 'border-primary ring-2 ring-primary'
                                : 'border-border'
                            }`}
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <h5 className="font-medium">{packageService.service.name}</h5>
                                <p className="text-sm text-muted-foreground">{packageService.service.duration} dk</p>
                              </div>
                              <Badge variant={remainingCount > 0 ? "outline" : "destructive"}>
                                Kalan: {remainingCount}/{packageService.sessions}
                              </Badge>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
