"use client"

import { useQuery } from "@tanstack/react-query"
import api from "@/lib/api"
import { Customer } from "../data/schema"
import { useAuthStore } from "@/stores/auth.store"
import { useState, useEffect } from "react"
import { UserRole } from "@/types/user"

export function useCustomers(filterBranchId?: string, tagIds?: string[]) {
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
    queryKey: ["customers", "analytics", branchIdToFetch, tagIds, token],
    queryFn: async () => {
      // Analytics endpoint'ini kullan
      const params: any = {};
      if (branchIdToFetch) params.branchId = branchIdToFetch;
      if (tagIds && tagIds.length > 0) params.tagIds = tagIds.join(',');
      
      const response = await api.get('/customers/analytics', { params });
      if (response.data && Array.isArray(response.data.data)) {
        return response.data.data.map((customer: any) => ({
         ...customer,
         tags: customer.tags || [],
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

// İstatistik kartları için hook
export function useCustomerStats(filterBranchId?: string) {
  const user = useAuthStore((state) => state.user)
  const token = useAuthStore((state) => state.token)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  const isAdmin = user?.role === UserRole.ADMIN || user?.role === UserRole.SUPER_BRANCH_MANAGER;
  const branchIdToFetch = isAdmin ? filterBranchId : user?.branch?.id;

  return useQuery({
    queryKey: ["customer-stats", branchIdToFetch, token],
    queryFn: async () => {
      const params = branchIdToFetch ? { branchId: branchIdToFetch } : {};
      const response = await api.get('/customers/stats', { params });
      return response.data;
    },
    enabled: isClient && !!token && !!user,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 30000, // 30 saniye cache
  })
}

// Tag istatistikleri için hook
export function useTagStats(filterBranchId?: string) {
  const user = useAuthStore((state) => state.user)
  const token = useAuthStore((state) => state.token)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  const isAdmin = user?.role === UserRole.ADMIN || user?.role === UserRole.SUPER_BRANCH_MANAGER;
  const branchIdToFetch = isAdmin ? filterBranchId : user?.branch?.id;

  return useQuery({
    queryKey: ["tag-stats", branchIdToFetch, token],
    queryFn: async () => {
      const params = branchIdToFetch ? { branchId: branchIdToFetch } : {};
      const response = await api.get('/customers/tags/stats', { params });
      return response.data;
    },
    enabled: isClient && !!token && !!user,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 60000, // 1 dakika cache
  })
}
