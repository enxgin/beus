"use client"

import { useQuery } from "@tanstack/react-query"
import api from "@/lib/api"
import { Customer } from "../data/schema"
import { useAuthStore } from "@/stores/auth.store"
import { useState, useEffect } from "react"
import { UserRole } from "@/types/user"

export function useCustomers(filterBranchId?: string) {
  // Fix: Use separate selectors to avoid creating new object references which cause infinite loops
  const user = useAuthStore((state) => state.user)
  const token = useAuthStore((state) => state.token)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  const isAdmin = user?.role === UserRole.ADMIN || user?.role === UserRole.SUPER_BRANCH_MANAGER;

  // Admin/Super Admin için component'ten gelen filtreyi kullan,
  // diğer roller için kendi şubesini kullan.
  const branchIdToFetch = isAdmin ? filterBranchId : user?.branch?.id;

  return useQuery<Customer[]>({
    // Query key'i component'ten gelen filtreye bağla ki değiştiğinde yeniden tetiklensin
    queryKey: ["customers", branchIdToFetch, token],
    queryFn: async () => {
      // API isteğini her zaman query parametresi ile yap, backend rolü zaten biliyor.
      const params = branchIdToFetch ? { branchId: branchIdToFetch } : {};
      const response = await api.get('/customers', { params });
      if (response.data && Array.isArray(response.data.data)) {
        // tags alanını doğrudan Tag[] olarak map et
        return response.data.data.map((customer: any) => ({
          ...customer,
          tags: Array.isArray(customer.tags)
            ? customer.tags.map((ct: any) => ct.tag)
            : [],
        }));
      }
      if (Array.isArray(response.data)) {
        return response.data.map((customer: any) => ({
          ...customer,
          tags: Array.isArray(customer.tags)
            ? customer.tags.map((ct: any) => ct.tag)
            : [],
        }));
      }
      return []
    },
    enabled: isClient && !!token && !!user,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 1000,
  })
}
