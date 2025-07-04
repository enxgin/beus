"use client"

import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { Service } from "@/types/service"
import { useAuthStore } from "@/stores/auth.store"
import { UserRole } from "@/types/user"
import { useEffect, useState } from "react"

export function useServices() {
  const { user } = useAuthStore()
  const [branchIds, setBranchIds] = useState<string[] | undefined>(undefined)
  
  // Rol bazlı filtreleme için kullanıcının şube erişimlerini belirleme
  useEffect(() => {
    const fetchBranchAccess = async () => {
      if (!user) return

      try {
        // ADMIN: Tüm şubelere erişim (filtreleme yok)
        if (user.role === UserRole.ADMIN) {
          setBranchIds(undefined) // Tüm şubeler
          return
        }
        
        // SUPER_BRANCH_MANAGER: Kendi şubesi ve alt şubeleri
        if (user.role === UserRole.SUPER_BRANCH_MANAGER && user.branch?.id) {
          try {
            // Alt şubeleri almak için API'ye istek yap
            const response = await api.get(`/branches/${user.branch.id}/sub-branches`)
            const subBranches = response.data || []
            
            // Kendi şubesi ve alt şubeler
            const accessibleBranchIds = [
              user.branch.id,
              ...subBranches.map((branch: any) => branch.id)
            ]
            
            setBranchIds(accessibleBranchIds)
          } catch (error) {
            console.error("Alt şubeler alınırken hata oluştu:", error)
            // Hata durumunda sadece kendi şubesi
            setBranchIds(user.branch?.id ? [user.branch.id] : [])
          }
        } 
        // BRANCH_MANAGER, STAFF, RECEPTION: Sadece kendi şubesi
        else if (user.branch?.id) {
          setBranchIds([user.branch.id])
        } else {
          setBranchIds([])
        }
      } catch (error) {
        console.error("Şube erişimleri belirlenirken hata:", error)
        setBranchIds([])
      }
    }

    fetchBranchAccess()
  }, [user])

  return useQuery<Service[]>({
    queryKey: ["services", branchIds],
    queryFn: async () => {
      try {
        // Şube bazlı filtreleme için query parametreleri oluştur
        let queryParams = ""
        
        // ADMIN rolü hariç şube filtresi uygula
        if (user?.role !== UserRole.ADMIN && branchIds?.length) {
          // Birden fazla şube ID'si varsa (SUPER_BRANCH_MANAGER için)
          if (branchIds.length > 1) {
            queryParams = `?branchIds=${branchIds.join(",")}`
          } 
          // Tek şube ID'si varsa
          else if (branchIds.length === 1) {
            queryParams = `?branchId=${branchIds[0]}`
          }
        }

        console.log("Services API request:", `/services${queryParams}`)
        const response = await api.get(`/services${queryParams}`)
        return response.data
      } catch (error) {
        console.error("Hizmetler alınırken hata:", error)
        return []
      }
    },
    enabled: branchIds !== undefined, // branchIds belirlendiğinde sorguyu çalıştır
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 1000 // 1 saniye sonra yeniden fetch et
  })
}
