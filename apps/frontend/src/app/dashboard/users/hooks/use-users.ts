import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { User } from '@/types/user';
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
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

// Kullanıcıyı güncelleyen mutation hook'u
export function useUpdateUser(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (updatedUserData: Partial<User>) => api.patch(`/users/${userId}`, updatedUserData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user', userId] });
    },
  });
}
