"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { HomeIcon } from "lucide-react"
import { DataTable } from "./components/data-table"
import { getColumns } from "./components/columns"
import { useServiceCategories } from "./hooks/use-service-categories"
import { useToast } from "@/components/ui/use-toast"
import { useAuthStore } from "@/stores/auth.store"

export default function ServiceCategoriesPage() {
  const { toast } = useToast()
  const router = useRouter()
  const { isHydrated, token } = useAuthStore()
  const { data: categories, isLoading, error, isError } = useServiceCategories()

  // Redirect to login if not authenticated after hydration
  useEffect(() => {
    if (isHydrated && !token) {
      toast({
        title: "Oturum hatası",
        description: "Lütfen tekrar giriş yapın.",
        variant: "destructive",
      })
      router.push("/")
    }
  }, [isHydrated, token, router, toast])

  // Display error toast if the query fails
  useEffect(() => {
    if (isError && error) {
      console.error("Hizmet kategorileri yüklenirken hata:", error)
      toast({
        title: "Hata",
        description: error.message || "Hizmet kategorileri yüklenirken bir hata oluştu.",
        variant: "destructive",
      })
    }
  }, [isError, error, toast])

  const columns = getColumns()

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
            <BreadcrumbLink>Hizmet Kategorileri</BreadcrumbLink>
          </BreadcrumbItem>
        </Breadcrumb>
        <div className="flex items-center justify-between mt-2">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Hizmet Kategorileri</h1>
            <p className="text-muted-foreground mt-1">
              Hizmet kategorilerinizi görüntüleyin ve yönetin.
            </p>
          </div>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={categories || []}
        isLoading={isLoading}
      />
    </div>
  )
}
