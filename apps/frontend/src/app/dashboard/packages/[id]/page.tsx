"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { getPackage } from "../api";
import type { Package } from "@/types";
import { useAuth } from "../../../../hooks/use-auth";
import { Button } from "../../../../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../../../../components/ui/card";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink } from "../../../../components/ui/breadcrumb";
import { HomeIcon, PackageIcon, PencilIcon, ArrowLeftIcon } from "lucide-react";
import { formatTurkishLira } from "../../../../lib/utils";
import { Badge } from "../../../../components/ui/badge";
import { Skeleton } from "../../../../components/ui/skeleton";
import Link from "next/link";

const PackageDetailPage = () => {
  const router = useRouter();
  const { id } = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [packageData, setPackageData] = useState<Package | null>(null);
  const [error, setError] = useState("");
  
  const { isAuthenticated, loading: authLoading, user } = useAuth();

  useEffect(() => {
    const fetchPackage = async () => {
      if (typeof id !== "string") return;
      
      // Auth yüklenmesi bekleniyor, bu aşamada işlem yapma
      if (authLoading) return;
      
      // Oturum açılmamışsa ve sayfa yüklenmesi tamamlandıysa login'e yönlendir
      if (!isAuthenticated) {
        router.push('/login?redirect=' + encodeURIComponent(`/dashboard/packages/${id}`));
        return;
      }
      
      try {
        setIsLoading(true);
        const data = await getPackage(id);
        setPackageData(data);
      } catch (err: any) {
        console.error("Paket getirme hatası:", err);
        
        // 401 hatası için oturumu sonlandır ve login'e yönlendir
        if (err?.response?.status === 401) {
          router.push('/login?redirect=' + encodeURIComponent(`/dashboard/packages/${id}`));
          setError("Oturum süresi dolmuş. Lütfen tekrar giriş yapın.");
        } else {
          setError(err.message || "Paket bilgileri getirilemedi");
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPackage();
  }, [id, isAuthenticated, authLoading, router]);
  
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="space-y-6">
        <Breadcrumb>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard">
              <HomeIcon className="h-4 w-4 mr-1" />
              Ana Sayfa
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard/packages">Paketler</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbItem isCurrentPage>
            <BreadcrumbLink>Hata</BreadcrumbLink>
          </BreadcrumbItem>
        </Breadcrumb>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-destructive">Hata Oluştu</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
          </CardContent>
          <CardFooter>
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeftIcon className="mr-2 h-4 w-4" />
              Geri Dön
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  if (!packageData) {
    return null;
  }
  
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
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard/packages">Paketler</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbItem isCurrentPage>
            <BreadcrumbLink>{packageData.name}</BreadcrumbLink>
          </BreadcrumbItem>
        </Breadcrumb>
        
        <div className="flex justify-between items-center mt-2">
          <h1 className="text-3xl font-bold tracking-tight">{packageData.name}</h1>
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeftIcon className="mr-2 h-4 w-4" />
              Geri
            </Button>
            <Button asChild>
              <Link href={`/dashboard/packages/${packageData.id}/edit`}>
                <PencilIcon className="mr-2 h-4 w-4" />
                Düzenle
              </Link>
            </Button>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Paket Bilgileri</CardTitle>
            <CardDescription>Paketin temel bilgileri</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Paket Adı</p>
                <p className="text-lg font-medium">{packageData.name}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-muted-foreground">Fiyat</p>
                <p className="text-lg font-medium">{formatTurkishLira(packageData.price)}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tip</p>
                <Badge variant="outline">
                  {packageData.type === "SESSION" ? "Seans" : "Süre"}
                </Badge>
              </div>
              
              <div>
                <p className="text-sm font-medium text-muted-foreground">Geçerlilik Süresi</p>
                <p className="text-lg font-medium">{packageData.validityDays} gün</p>
              </div>
              
              {/* Şube bilgisi sadece ADMIN ve SUPER_BRANCH_MANAGER rollerine gösterilir */}
              {(user?.role === "ADMIN" || user?.role === "SUPER_BRANCH_MANAGER") && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Şube</p>
                  {packageData.branch?.name ? (
                    <Badge variant="outline" className="bg-blue-50 text-lg font-medium">
                      {packageData.branch.name}
                    </Badge>
                  ) : (
                    <p className="text-lg font-medium text-muted-foreground">-</p>
                  )}
                </div>
              )}
              
              {packageData.totalSessions !== null && packageData.totalSessions !== undefined && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Toplam Seans</p>
                  <p className="text-lg font-medium">{packageData.totalSessions}</p>
                </div>
              )}
              
              {packageData.totalMinutes !== null && packageData.totalMinutes !== undefined && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Toplam Dakika</p>
                  <p className="text-lg font-medium">{packageData.totalMinutes}</p>
                </div>
              )}
              
              <div>
                <p className="text-sm font-medium text-muted-foreground">Oluşturulma Tarihi</p>
                <p className="text-lg font-medium">{packageData.createdAt ? new Date(packageData.createdAt).toLocaleDateString('tr-TR') : '-'}</p>
              </div>
            </div>
            
            {packageData.description && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Açıklama</p>
                <p className="text-base">{packageData.description}</p>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Hizmetler</CardTitle>
            <CardDescription>Pakete dahil olan hizmetler</CardDescription>
          </CardHeader>
          <CardContent>
            {packageData.services && packageData.services.length > 0 ? (
              <div className="space-y-4">
                {packageData.services.map((serviceItem) => (
                  <div key={serviceItem.serviceId} className="flex justify-between items-center border-b pb-2">
                    <div>
                      <p className="font-medium">{serviceItem.service?.name || 'Hizmet Adı'}</p>
                      <p className="text-sm text-muted-foreground">Birim Fiyat: {formatTurkishLira(serviceItem.service?.price || 0)}</p>
                    </div>
                    <Badge variant="secondary">{serviceItem.quantity} adet</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">Bu pakette hiç hizmet bulunmuyor.</p>
            )}
          </CardContent>
        </Card>
        
        {(packageData.commissionRate !== null || packageData.commissionFixed !== null) && (
          <Card>
            <CardHeader>
              <CardTitle>Komisyon Bilgileri</CardTitle>
              <CardDescription>Personel komisyon detayları</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {packageData.commissionRate !== null && packageData.commissionRate !== undefined && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Komisyon Oranı</p>
                    <p className="text-lg font-medium">%{packageData.commissionRate}</p>
                  </div>
                )}
                
                {packageData.commissionFixed !== null && packageData.commissionFixed !== undefined && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Sabit Komisyon</p>
                    <p className="text-lg font-medium">{formatTurkishLira(packageData.commissionFixed)}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default PackageDetailPage;
