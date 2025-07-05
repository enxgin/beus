import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPackages, deletePackage } from '../api';
import { toast } from 'sonner';

export const usePackages = () => {
  const queryClient = useQueryClient();

  const packagesQuery = useQuery({
    queryKey: ['packages'],
    queryFn: getPackages,
  });

  const deletePackageMutation = useMutation({
    mutationFn: deletePackage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packages'] });
      toast.success('Paket başarıyla silindi');
    },
    onError: (error) => {
      console.error('Paket silme hatası:', error);
      toast.error('Paket silinirken bir hata oluştu');
    },
  });

  return {
    packages: packagesQuery.data || [],
    isLoading: packagesQuery.isLoading,
    isError: packagesQuery.isError,
    error: packagesQuery.error,
    deletePackage: deletePackageMutation.mutate,
    isDeletingPackage: deletePackageMutation.isPending,
  };
};
