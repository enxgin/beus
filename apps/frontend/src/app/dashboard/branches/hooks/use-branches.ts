import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { type Branch } from '../components/columns'
import { type BranchFormValues } from '../components/branch-form'

// Tüm şubeleri getiren hook
export function useBranches() {
  return useQuery<Branch[], Error>({
    queryKey: ['branches'],
    queryFn: async () => {
      const response = await api.get('/branches')
      return response.data
    },
  })
}

// Yeni şube oluşturan hook
export function useCreateBranch() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (branchData: BranchFormValues) => {
      // Son deneme: Backend'in `NOT NULL` kısıtlamaları olabileceği teorisine göre hareket ediyoruz.
      // - Metin alanlarını (adres, açıklama) formdan geldiği gibi (boş string '') bırakıyoruz.
      // - Sadece opsiyonel ilişki alanı olan parentBranchId'yi, eğer seçilmemişse, payload'dan siliyoruz.
      const payload: Partial<BranchFormValues> = { ...branchData };

      if (payload.parentBranchId === null || payload.parentBranchId === '') {
        delete payload.parentBranchId;
      }

      const response = await api.post('/branches', payload);
      return response.data;
    },
    onSuccess: () => {
      // Başarılı olursa şube listesini yeniden çekmek için cache'i geçersiz kıl
      queryClient.invalidateQueries({ queryKey: ['branches'] })
    },
  })
}

// Mevcut şubeyi güncelleyen hook
export function useUpdateBranch() {
  const queryClient = useQueryClient()

  return useMutation({
        mutationFn: async ({ id, ...updateData }: { id: string } & BranchFormValues) => {
      // Backend'in 500 hatasını kesin olarak çözmek için, null veya boş olan opsiyonel alanları
      // payload'dan tamamen kaldırıyoruz. Bu, PATCH istekleri için daha standart bir yaklaşımdır
      // ve sunucunun sadece dolu olan alanları işlemesini sağlar.
      const payload: Partial<BranchFormValues> = { ...updateData };

      (Object.keys(payload) as Array<keyof typeof payload>).forEach((key) => {
        // name ve phone zorunlu olduğu için bu kontrol onları etkilemez.
        if (payload[key] === null || payload[key] === '') {
          delete payload[key];
        }
      });

      const response = await api.patch(`/branches/${id}`, payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] })
    },
  })
}

// Şubeyi silen hook
export function useDeleteBranch() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/branches/${id}`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] })
    },
  })
}
