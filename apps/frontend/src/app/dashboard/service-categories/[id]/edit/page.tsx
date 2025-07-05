"use client"

import { useEffect, useState } from "react"
import api from "@/lib/api"
import { CategoryForm } from "../../components/category-form"
import { ServiceCategory } from "../../data/schema"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import { useAuthStore } from "@/stores/auth.store"
import { useParams } from "next/navigation"
import axios from "axios"

export default function EditCategoryPage() {
  const params = useParams()
  const id = params.id as string
  const [category, setCategory] = useState<ServiceCategory | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const { toast } = useToast()
  
  // Auth store'dan token ve hydration durumunu al
  const { token, isHydrated } = useAuthStore()

  useEffect(() => {
    const controller = new AbortController()

    async function fetchCategory() {
      try {
        setLoading(true)
        const response = await api.get(`/services/categories/${id}`, {
          signal: controller.signal,
        })
        setCategory(response.data)
      } catch (error: any) {
        if (axios.isCancel(error)) {
          console.log("Request canceled by cleanup")
          return
        }
        console.error(`Kategori (ID: ${id}) yüklenirken hata oluştu:`, error)
        toast({
          title: "Hata",
          description:
            error.response?.data?.message ||
            "Kategori yüklenirken bir hata oluştu.",
          variant: "destructive",
        })
        router.push("/dashboard/service-categories/not-found")
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }

    if (isHydrated) {
      if (!token) {
        toast({
          title: "Oturum hatası",
          description: "Oturumunuz sonlanmış. Lütfen tekrar giriş yapın.",
          variant: "destructive",
        })
        router.push("/")
        return
      }
      fetchCategory()
    }

    return () => {
      controller.abort()
    }
  }, [isHydrated, token, router, toast, id])

  if (loading) {
    return (
      <div className="container mx-auto py-10">
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  if (!category) {
    return null
  }

  return (
    <div className="container mx-auto py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Kategori Düzenle</h1>
        <p className="text-muted-foreground">
          "{category.name}" kategorisini düzenleyin.
        </p>
      </div>
      <div className="max-w-2xl">
        <CategoryForm category={category} isEdit={true} />
      </div>
    </div>
  )
}
