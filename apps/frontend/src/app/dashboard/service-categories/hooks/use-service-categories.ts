"use client"

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import { ServiceCategory } from '../data/schema';

const fetchServiceCategories = async (token: string | null, branchId?: string): Promise<ServiceCategory[]> => {
  if (!token) {
    // The query is disabled via the 'enabled' flag, but as a safeguard:
    return [];
  }

  const response = await api.get<ServiceCategory[]>('/service-categories', {
    params: {
      branchId: branchId,
    },
  });
  return response.data;
};

export const useServiceCategories = () => {
  const { token, user } = useAuthStore();
  
  const userRole = user?.role;
  const userBranchId = user?.branch?.id;
  let queryBranchId: string | undefined = undefined;

  if (userRole && userRole !== 'ADMIN' && userRole !== 'SUPER_BRANCH_MANAGER' && userBranchId) {
    queryBranchId = userBranchId;
  }

  return useQuery<ServiceCategory[], Error>({
    queryKey: ['service-categories', queryBranchId],
    queryFn: () => fetchServiceCategories(token, queryBranchId),
    enabled: !!token,
  });
};
