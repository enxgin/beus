"use client";

import { PackagesTable } from "./components/PackagesTable";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator } from "../../../components/ui/breadcrumb";
import { HomeIcon } from "lucide-react";

const PackagesPage = () => {
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
          <BreadcrumbItem isCurrentPage>
            <BreadcrumbLink>Paketler</BreadcrumbLink>
          </BreadcrumbItem>
        </Breadcrumb>
        <h1 className="text-3xl font-bold tracking-tight mt-2">Paket Yönetimi</h1>
        <p className="text-muted-foreground mt-1">
          Sistem içerisindeki paketleri görüntüleyin, düzenleyin veya silin.
        </p>
      </div>
      
      <PackagesTable />
    </div>
  );
};

export default PackagesPage;
