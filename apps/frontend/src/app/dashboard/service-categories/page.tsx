"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
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
    <div className="container mx-auto py-10">
      <DataTable
        columns={columns}
        data={categories || []}
        isLoading={isLoading}
      />
    </div>
  )
}
