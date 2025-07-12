"use client"

import { useQuery } from "@tanstack/react-query"
import api from "@/lib/api"
import { CategoryForm } from "../../components/category-form"
import { ServiceCategory } from "../../data/schema"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import { useAuthStore } from "@/stores/auth.store"
import { useParams } from "next/navigation"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { HomeIcon } from "lucide-react"

export default function EditCategoryPage() {
  const params = useParams()
  const id = params.id as string
  const router = useRouter()
  const { toast } = useToast()
  
  // Auth store'dan token ve hydration durumunu al
  const { token, isHydrated } = useAuthStore()

  // React Query ile kategori verilerini çek
  const { data: category, isLoading, isError, error } = useQuery<ServiceCategory>({
    queryKey: ["service-category", id],
    queryFn: async () => {
      const response = await api.get(`/services/categories/${id}`)
      return response.data
    },
    enabled: isHydrated && !!token && !!id,
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 dakika
  })

  // Auth kontrolü
  if (isHydrated && !token) {
    toast({
      title: "Oturum hatası",
      description: "Oturumunuz sonlanmış. Lütfen tekrar giriş yapın.",
      variant: "destructive",
    })
    router.push("/")
    return null
  }

  // Hata durumu
  if (isError) {
    console.error(`Kategori (ID: ${id}) yüklenirken hata oluştu:`, error)
    toast({
      title: "Hata",
      description: "Kategori yüklenirken bir hata oluştu.",
      variant: "destructive",
    })
    router.push("/dashboard/service-categories/not-found")
    return null
  }

  // Yükleniyor durumu
  if (isLoading || !isHydrated) {
    return (
      <div className="space-y-6">
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  // Kategori bulunamadı
  if (!category) {
    return null
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
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard/service-categories">Servis Kategorileri</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem isCurrentPage>
            <BreadcrumbLink>Kategori Düzenle</BreadcrumbLink>
          </BreadcrumbItem>
        </Breadcrumb>
        <h1 className="text-3xl font-bold tracking-tight mt-2">Kategori Düzenle</h1>
        <p className="text-muted-foreground mt-1">
          "{category.name}" kategorisini düzenleyin.
        </p>
      </div>
      
      <div className="max-w-2xl">
        <CategoryForm category={category} isEdit={true} />
      </div>
    </div>
  )
}
