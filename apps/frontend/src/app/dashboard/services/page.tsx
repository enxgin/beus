"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useDebounce } from "use-debounce";
import { PlusCircle, Search, HomeIcon } from "lucide-react";

import { getColumns } from "./components/columns";
import { DataTable } from "./components/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useAuthStore } from "@/stores/auth.store";
import { useServices } from "./hooks/use-services";
import { useBranches } from "@/hooks/use-branches";
import { UserRole } from "@/types/user";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const ServicesPage = () => {
  const { user, isHydrated } = useAuthStore();
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm] = useDebounce(searchTerm, 500);
  const [selectedBranch, setSelectedBranch] = useState<string | undefined>(
    user?.role !== UserRole.ADMIN && user?.role !== UserRole.SUPER_BRANCH_MANAGER
      ? user?.branchId
      : undefined
  );

  const { data: branchesData, isLoading: isLoadingBranches } = useBranches(user);

  const servicesQuery = useServices({
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
    search: debouncedSearchTerm,
    branchId: selectedBranch,
  });

  const { data, isLoading, isError, error } = servicesQuery;
  const { data: services = [], totalCount = 0 } = data || {};

  const columns = useMemo(() => getColumns(user?.role || null), [user]);

  const pageCount = Math.ceil(totalCount / pagination.pageSize);

  const showBranchFilter = user?.role === UserRole.ADMIN || user?.role === UserRole.SUPER_BRANCH_MANAGER;

  if (!isHydrated || isLoading) {
    return (
      <div className="container mx-auto py-10 space-y-6">
        <div className="flex justify-between items-center mb-6">
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    );
  }

  if (isError) {
    return <div className="p-4 text-red-500">Hata: {(error as Error).message}</div>;
  }

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
          <BreadcrumbItem isCurrentPage>
            <BreadcrumbLink>Hizmetler</BreadcrumbLink>
          </BreadcrumbItem>
        </Breadcrumb>
        <div className="flex items-center justify-between mt-2">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Hizmet Yönetimi</h1>
            <p className="text-muted-foreground mt-1">
              Hizmetlerinizi görüntüleyin ve yönetin.
            </p>
          </div>
          <Button asChild>
            <Link href="/dashboard/services/create">
              <PlusCircle className="mr-2 h-4 w-4" />
              Yeni Hizmet Ekle
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Hizmet adı veya kategori ile arayın..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        {showBranchFilter && (
          <Select onValueChange={setSelectedBranch} value={selectedBranch}>
            <SelectTrigger className="w-[280px]">
              <SelectValue placeholder="Şube Seçin" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Şubeler</SelectItem>
              {branchesData?.map((branch) => (
                <SelectItem key={branch.id} value={branch.id}>
                  {branch.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <DataTable
        columns={columns}
        data={services}
        pageCount={pageCount}
        pagination={pagination}
        setPagination={setPagination}
        isLoading={isLoading}
      />
    </div>
  );
};

export default ServicesPage;
