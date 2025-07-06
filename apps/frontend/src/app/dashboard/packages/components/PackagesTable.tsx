import { Button } from "../../../../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../../components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../../components/ui/table";
import type { Package } from "@/types";
import Link from "next/link";
import { PencilIcon, Trash2Icon, EyeIcon, PlusIcon } from "lucide-react";
import { formatTurkishLira } from "../../../../lib/utils";
import { usePackages } from "../hooks/usePackages";
import { useAuth } from "../../../../hooks/use-auth";
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
} from "../../../../components/ui/alert-dialog";
import { Badge } from "../../../../components/ui/badge";
import { Skeleton } from "../../../../components/ui/skeleton";

export const PackagesTable = () => {
  const { packages, isLoading, deletePackage } = usePackages();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [packageToDelete, setPackageToDelete] = useState<string | null>(null);
  const { user } = useAuth();
  
  // Admin veya şube yöneticisi olup olmadığını kontrol ediyoruz
  const isAdmin = user?.role === 'ADMIN';
  const isSuperBranchManager = user?.role === 'SUPER_BRANCH_MANAGER';
  const isBranchManager = user?.role === 'BRANCH_MANAGER';

  const handleDeleteClick = (packageId: string) => {
    setPackageToDelete(packageId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (packageToDelete) {
      deletePackage(packageToDelete);
      setDeleteDialogOpen(false);
      setPackageToDelete(null);
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Paketler</CardTitle>
            <CardDescription>
              {isAdmin 
                ? "Sistem içerisindeki tüm paketlerin listesi" 
                : isSuperBranchManager 
                  ? "Yönetici olduğunuz şubelerin paketleri"
                  : "Sizin şubenize ait paketlerin listesi"}
            </CardDescription>
          </div>
          {/* Yeni paket ekleyebilecek roller: Admin, SuperBranchManager ve BranchManager */}
          {(isAdmin || isSuperBranchManager || isBranchManager) && (
            <Button asChild>
              <Link href="/dashboard/packages/new">
                <PlusIcon className="mr-2 h-4 w-4" />
                Yeni Paket
              </Link>
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className="w-full h-12" />
              ))}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Paket Adı</TableHead>
                    <TableHead>Çeşit</TableHead>
                    <TableHead>Fiyat</TableHead>
                    <TableHead>Geçerlilik</TableHead>
                    {/* Şube kolonu sadece ADMIN ve SUPER_BRANCH_MANAGER için göster */}
                    {(isAdmin || isSuperBranchManager) && (
                      <TableHead>Şube</TableHead>
                    )}
                    <TableHead className="text-right">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {packages.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center h-24 text-muted-foreground"
                      >
                        {isAdmin ? (
                          "Henüz sisteme hiç paket tanımlanmamış."
                        ) : isSuperBranchManager ? (
                          "Yönetici olduğunuz şubelerde henüz paket tanımlanmamış."
                        ) : (
                          "Şubenize ait paket bulunmamaktadır."
                        )}
                      </TableCell>
                    </TableRow>
                  ) : (
                    packages.map((pkg) => (
                      <TableRow key={pkg.id}>
                        <TableCell className="font-medium">{pkg.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {pkg.type === "SESSION" ? "Seans" : "Süre"}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatTurkishLira(pkg.price)}</TableCell>
                        <TableCell>{pkg.validityDays} gün</TableCell>
                        {/* Şube hücresi sadece ADMIN ve SUPER_BRANCH_MANAGER için göster */}
                        {(isAdmin || isSuperBranchManager) && (
                          <TableCell>
                            {pkg.branch?.name ? (
                              <Badge variant="outline" className="bg-blue-50">
                                {pkg.branch.name}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                        )}
                        <TableCell className="text-right space-x-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            asChild
                          >
                            <Link href={`/dashboard/packages/${pkg.id}`}>
                              <EyeIcon className="h-4 w-4" />
                              <span className="sr-only">Görüntüle</span>
                            </Link>
                          </Button>
                          {/* Düzenle butonu - sadece Admin, SuperBranchManager veya kendi şubesindeki paketler için BranchManager */}
                          {(isAdmin || isSuperBranchManager || (isBranchManager && user?.branch?.id === pkg.branch?.id)) && (
                            <Button
                              size="icon"
                              variant="ghost"
                              asChild
                            >
                              <Link href={`/dashboard/packages/${pkg.id}/edit`}>
                                <PencilIcon className="h-4 w-4" />
                                <span className="sr-only">Düzenle</span>
                              </Link>
                            </Button>
                          )}
                          
                          {/* Silme butonu - Admin, SuperBranchManager ve BranchManager için */}
                          {(isAdmin || isSuperBranchManager || (isBranchManager && user?.branch?.id === pkg.branch?.id)) && (
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleDeleteClick(pkg.id)}
                            >
                              <Trash2Icon className="h-4 w-4 text-destructive" />
                              <span className="sr-only">Sil</span>
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Paketi silmek istediğinize emin misiniz?</AlertDialogTitle>
            <AlertDialogDescription>
              Bu işlem geri alınamaz. Paket kalıcı olarak silinecektir.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Vazgeç</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
