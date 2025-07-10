"use client"

import { useQuery } from "@tanstack/react-query"
import api from "@/lib/api"

export interface CustomerAnalytics {
  lifecycle: {
    registrationDate: string
    daysSinceRegistration: number
    stage: 'new' | 'developing' | 'loyal' | 'vip'
    stageLabel: string
    stageColor: string
  }
  loyaltyScore: {
    score: number
    level: string
    breakdown: {
      frequency: number
      spending: number
      tenure: number
      recency: number
    }
  }
  appointmentPattern: {
    averageInterval: number
    intervalUnit: string
    consistency: number
    totalAppointments: number
  }
  favoriteServices: {
    top3: Array<{
      id: string
      name: string
      count: number
      percentage: number
    }>
    totalServices: number
  }
}

export function useCustomerAnalytics(customerId: string) {
  return useQuery<CustomerAnalytics>({
    queryKey: ["customer-analytics", customerId],
    queryFn: async () => {
      const response = await api.get(`/customers/${customerId}/analytics`)
      return response.data
    },
    enabled: !!customerId,
    staleTime: 5 * 60 * 1000, // 5 dakika cache
    refetchOnWindowFocus: false,
  })
}