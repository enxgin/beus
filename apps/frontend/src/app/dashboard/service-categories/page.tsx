"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { api } from "@/lib/api"
import { DataTable } from "./components/data-table"
import { getColumns } from "./components/columns"
import { ServiceCategory } from "./data/schema"
import { useToast } from "@/components/ui/use-toast"
import { useAuthStore } from "@/stores/auth.store"

export default function ServiceCategoriesPage() {
  const [categories, setCategories] = useState<ServiceCategory[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const router = useRouter()
  
  // Auth store'dan token, kullanıcı rolü ve hydration durumunu al
  const { accessToken, user, isHydrated } = useAuthStore()
  const userRole = user?.role

  useEffect(() => {
    // Auth durumunu kontrol et
    if (isHydrated) {
      if (!accessToken) {
        toast({
          title: "Oturum hatası",
          description: "Oturumunuz sonlanmış. Lütfen tekrar giriş yapın.",
          variant: "destructive",
        })
        router.push("/")
        return
      }
      
      // Token varsa kategorileri getir
      fetchCategories()
    }
  }, [isHydrated, accessToken, router, toast])

  async function fetchCategories() {
    try {
      setLoading(true)
      console.log("API isteği gönderiliyor, token:", accessToken ? "Mevcut" : "Yok")
      
      // Kullanıcı rolüne göre filtreleme yapma
      let url = "/service-categories"
      
      // Sadece ADMIN ve SUPER_BRANCH_MANAGER tüm kategorileri görebilir
      // BRANCH_MANAGER ve STAFF sadece kendi şubelerine ait kategorileri görebilir
      if (userRole && userRole !== 'ADMIN' && userRole !== 'SUPER_BRANCH_MANAGER' && user?.branch?.id) {
        // Branch manager ve normal personel için şube filtresi ekle
        url += `?branchId=${user.branch.id}`
      }
      
      const response = await api.get(url)
      setCategories(response.data)
    } catch (error: any) {
      console.error("Kategoriler yüklenirken hata oluştu:", error)
      toast({
        title: "Hata",
        description: error.response?.data?.message || "Kategoriler yüklenirken bir hata oluştu.",
        variant: "destructive",
      })
      setCategories([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Hizmet Kategorileri</h1>
        <p className="text-muted-foreground">
          Salon hizmetleri için kategorileri yönetin.
        </p>
      </div>
      {loading ? (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
        </div>
      ) : (
        <DataTable columns={getColumns(userRole)} data={categories} />
      )}
    </div>
  )
}
