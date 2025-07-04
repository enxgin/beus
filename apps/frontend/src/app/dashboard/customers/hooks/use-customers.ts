"use client"

import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { Customer } from "../data/schema"
import { useAuth } from "@/hooks/use-auth"
import { UserRole } from "@/types/user"

export function useCustomers() {
  const { user } = useAuth()
  
  // Sadece admin ve süper şube yöneticisi tüm müşterileri görebilir
  const isAdmin = user?.role === UserRole.ADMIN || user?.role === UserRole.SUPER_BRANCH_MANAGER
  
  // Şube yöneticisi ve çalışanlar sadece kendi şubelerini görebilir
  // Kullanıcının şubesi
  const branchId = !isAdmin && user?.branch?.id ? user.branch.id : undefined
  
  return useQuery<Customer[]>({
    queryKey: ["customers", branchId],
    queryFn: async () => {
      // Şube filtresini query parametresi olarak ekliyoruz
      const endpoint = branchId 
        ? `/customers?branchId=${branchId}` 
        : "/customers"
      
      const response = await api.get(endpoint)
      return response.data
    },
    // Sayfa odaklandığında verileri otomatik yenile
    refetchOnWindowFocus: true,
    // Yönlendirme sonrası sayfa açıldığında her zaman yenile
    refetchOnMount: true,
    // Önbellek verilerinin stale (bayat) sayılacağı süre (ms)
    // Kısa tutarak, yeni müşteri eklenince hızlı güncelleme sağlıyoruz
    staleTime: 1000
  })
}
