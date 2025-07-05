"use client"

import { useQuery } from "@tanstack/react-query"
import api from "@/lib/api"
import { Customer } from "../data/schema"
import { useAuthStore } from "@/stores/auth.store"
import { useState, useEffect } from "react"
import { UserRole } from "@/types/user"

export function useCustomers() {
  // Fix: Use separate selectors to avoid creating new object references which cause infinite loops
  const user = useAuthStore((state) => state.user)
  const token = useAuthStore((state) => state.token)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  const isAdmin = user?.role === UserRole.ADMIN || user?.role === UserRole.SUPER_BRANCH_MANAGER
  const branchId = !isAdmin && user?.branch?.id ? user.branch.id : undefined

  return useQuery<Customer[]>({
    queryKey: ["customers", branchId, token],
    queryFn: async () => {
      const endpoint = branchId ? `/customers?branchId=${branchId}` : "/customers"
      const response = await api.get(endpoint)
      if (response.data && Array.isArray(response.data.data)) {
        return response.data.data
      }
      if (Array.isArray(response.data)) {
        return response.data
      }
      return []
    },
    enabled: isClient && !!token && !!user,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 1000,
  })
}
