import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { User, UserRole } from '@/types/user';
import { useAuthStore } from '@/stores/auth.store';
import { useState, useEffect } from 'react';

// Paginated response için tip
interface UsersResponse {
  data: User[];
  meta: { total: number };
}

// Tüm kullanıcıları çeken fonksiyon
async function fetchUsers(): Promise<UsersResponse> {
  console.log('fetchUsers çağrıldı');
  
  // Kullanıcının rolü ve şubesini kontrol et
  const { user: currentUser } = useAuthStore.getState();
  console.log('Current user role and branch:', {
    role: currentUser?.role,
    branchId: currentUser?.branchId
  });
  
  // Eğer kullanıcı bir şube yöneticisi ise ve şube ID'si varsa
  // bu şube ID'sini istek parametrelerine ekle
  let url = '/users';
  if (currentUser?.role === 'BRANCH_MANAGER' && currentUser?.branchId) {
    url = `/users?branchId=${currentUser.branchId}`;
    console.log('Branch manager, filtering by branch:', url);
  }
  
  try {
    console.log('API isteği yapılıyor:', url);
    const response = await api.get(url);
    console.log('API yanıtı:', response.data);
    return response.data;
  } catch (error) {
    console.error('API hatası:', error);
    throw error;
  }
}

// Tek bir kullanıcıyı çeken fonksiyon
async function fetchUserById(userId: string): Promise<User> {
  console.log(`fetchUserById(${userId}) çağrıldı`);
  try {
    const response = await api.get(`/users/${userId}`);
    console.log('Kullanıcı verisi yüklendi:', response.data);
    return response.data;
  } catch (error) {
    console.error(`Kullanıcı ${userId} yüklenirken hata:`, error);
    throw error;
  }
}

// Tüm kullanıcıları listeleyen hook
export function useUsers() {
  const token = useAuthStore((state) => state.token);

  return useQuery<UsersResponse, Error>({
    queryKey: ['users', token],
    queryFn: fetchUsers,
    // Sorguyu yalnızca token mevcut olduğunda (client-side) etkinleştir
    enabled: !!token,
  });
}

// Tek bir kullanıcıyı ID ile çeken hook
export function useUser(userId: string) {
  const token = useAuthStore((state) => state.token);

  return useQuery<User, Error>({
    queryKey: ['user', userId, token],
    queryFn: () => fetchUserById(userId),
    // Sorguyu yalnızca token mevcut olduğunda ve geçerli bir userId varsa etkinleştir
    enabled: !!token && userId !== 'new',
  });
}

// Yeni kullanıcı oluşturan mutation hook'u
export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (newUserData: Omit<User, 'id'>) => api.post('/users', newUserData),
    onSuccess: () => {
      // Tüm kullanıcı ile ilgili cache'leri invalidate et
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['users-with-performance'] });
      queryClient.invalidateQueries({ queryKey: ['users-statistics'] });
    },
  });
}

// Kullanıcıyı güncelleyen mutation hook'u
export function useUpdateUser(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (updatedUserData: Partial<User>) => api.patch(`/users/${userId}`, updatedUserData),
    onSuccess: () => {
      // Tüm kullanıcı ile ilgili cache'leri invalidate et
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['users-with-performance'] });
      queryClient.invalidateQueries({ queryKey: ['users-statistics'] });
      queryClient.invalidateQueries({ queryKey: ['user', userId] });
      queryClient.invalidateQueries({ queryKey: ['user-performance', userId] });
      queryClient.invalidateQueries({ queryKey: ['user-activities', userId] });
      queryClient.invalidateQueries({ queryKey: ['user-financial', userId] });
    },
  });
}

// İstatistik verilerini çeken hook
export function useUsersStatistics(filters?: {
  dateFrom?: string;
  dateTo?: string;
  branchId?: string;
}) {
  const token = useAuthStore((state) => state.token);

  return useQuery({
    queryKey: ['users-statistics', filters, token],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters?.dateTo) params.append('dateTo', filters.dateTo);
      if (filters?.branchId) params.append('branchId', filters.branchId);
      
      const response = await api.get(`/users/statistics?${params.toString()}`);
      return response.data;
    },
    enabled: !!token,
  });
}

// Performans verileri ile kullanıcıları çeken hook
export function useUsersWithPerformance(filters?: {
  dateFrom?: string;
  dateTo?: string;
  roles?: UserRole[];
  performance?: 'high' | 'medium' | 'low' | 'all';
  branchId?: string;
}) {
  const token = useAuthStore((state) => state.token);

  return useQuery({
    queryKey: ['users-with-performance', filters, token],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters?.dateTo) params.append('dateTo', filters.dateTo);
      if (filters?.roles) filters.roles.forEach(role => params.append('roles', role));
      if (filters?.performance) params.append('performance', filters.performance);
      if (filters?.branchId) params.append('branchId', filters.branchId);
      
      const response = await api.get(`/users/with-performance?${params.toString()}`);
      return response.data;
    },
    enabled: !!token,
  });
}

// Kullanıcı performans verilerini çeken hook
export function useUserPerformance(userId: string, filters?: {
  dateFrom?: string;
  dateTo?: string;
}) {
  const token = useAuthStore((state) => state.token);

  return useQuery({
    queryKey: ['user-performance', userId, filters, token],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters?.dateTo) params.append('dateTo', filters.dateTo);
      
      const response = await api.get(`/users/${userId}/performance?${params.toString()}`);
      return response.data;
    },
    enabled: !!token && userId !== 'new',
  });
}

// Kullanıcı aktivite geçmişini çeken hook
export function useUserActivities(userId: string, limit: number = 20) {
  const token = useAuthStore((state) => state.token);

  return useQuery({
    queryKey: ['user-activities', userId, limit, token],
    queryFn: async () => {
      const response = await api.get(`/users/${userId}/activities?limit=${limit}`);
      return response.data;
    },
    enabled: !!token && userId !== 'new',
  });
}

// Kullanıcı mali bilgilerini çeken hook
export function useUserFinancial(userId: string, filters?: {
  dateFrom?: string;
  dateTo?: string;
}) {
  const token = useAuthStore((state) => state.token);

  return useQuery({
    queryKey: ['user-financial', userId, filters, token],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters?.dateTo) params.append('dateTo', filters.dateTo);
      
      const response = await api.get(`/users/${userId}/financial?${params.toString()}`);
      return response.data;
    },
    enabled: !!token && userId !== 'new',
  });
}
