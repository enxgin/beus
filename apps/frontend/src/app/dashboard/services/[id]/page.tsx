"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Service } from "@/types/service";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit, Trash } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useMutation } from "@tanstack/react-query";

const ServiceDetailPage = () => {
  const router = useRouter();
  const { id } = useParams();
  const [isLoading, setIsLoading] = useState(false);

  const { data: service, isLoading: isServiceLoading } = useQuery<Service>({
    queryKey: ["service", id],
    queryFn: async () => {
      const { data } = await api.get(`/services/${id}`);
      return data;
    },
    enabled: !!id,
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      setIsLoading(true);
      await api.delete(`/services/${id}`);
    },
    onSuccess: () => {
      toast.success("Hizmet başarıyla silindi");
      router.push("/dashboard/services");
    },
    onError: (error: any) => {
      toast.error(`Silme işlemi başarısız: ${error.response?.data?.message || error.message}`);
    },
    onSettled: () => {
      setIsLoading(false);
    },
  });

  const handleDelete = () => {
    deleteMutation.mutate();
  };

  if (isServiceLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="container mx-auto py-10">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Hizmet bulunamadı</h1>
          <Button onClick={() => router.push("/dashboard/services")} className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Hizmetlere Dön
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <div className="mb-6 flex justify-between items-center">
        <Button variant="outline" onClick={() => router.push("/dashboard/services")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Hizmetlere Dön
        </Button>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={() => router.push(`/dashboard/services/${id}/edit`)}
          >
            <Edit className="mr-2 h-4 w-4" />
            Düzenle
          </Button>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={isLoading}>
                <Trash className="mr-2 h-4 w-4" />
                Sil
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Bu hizmeti silmek istediğinize emin misiniz?</AlertDialogTitle>
                <AlertDialogDescription>
                  Bu işlem geri alınamaz. Bu hizmeti sistemden kalıcı olarak sileceksiniz.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>İptal</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} disabled={isLoading} className="bg-destructive text-destructive-foreground">
                  {isLoading ? "Siliniyor..." : "Evet, Sil"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-2xl">{service.name}</CardTitle>
            <Badge variant={service.isActive ? "default" : "destructive"}>
              {service.isActive ? "Aktif" : "Pasif"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Kategori</h3>
                <p className="text-lg font-medium">{service.category?.name || "Belirtilmemiş"}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Şube</h3>
                <p className="text-lg font-medium">{service.branch?.name || "Belirtilmemiş"}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Süre</h3>
                <p className="text-lg font-medium">{service.duration} dakika</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Fiyat</h3>
                <p className="text-lg font-medium">
                  {new Intl.NumberFormat("tr-TR", {
                    style: "currency",
                    currency: "TRY",
                  }).format(service.price)}
                </p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Oluşturulma Tarihi</h3>
                <p className="text-lg font-medium">
                  {new Date(service.createdAt).toLocaleDateString("tr-TR")}
                </p>
              </div>
            </div>
          </div>
          
          <div className="mt-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">
              Bu Hizmeti Verebilecek Personeller
            </h3>
            <div className="flex flex-wrap gap-2">
              {service.staff && service.staff.length > 0 ? (
                service.staff.map((staffMember: any) => (
                  <Badge key={staffMember.id} variant="outline">
                    {staffMember.name}
                  </Badge>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">Personel atanmamış</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ServiceDetailPage;
