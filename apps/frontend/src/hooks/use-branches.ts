import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Branch } from "@/types/branch";
import { User, UserRole } from "@/types/user";
import { useAuthStore } from "@/stores/auth.store";

const fetchBranches = async (user: User | null): Promise<Branch[]> => {
  if (!user) return [];

  // ADMIN tüm şubeleri görür
  if (user.role === UserRole.ADMIN) {
    const response = await api.get("/branches");
    return response.data;
  }

  // SUPER_BRANCH_MANAGER kendi ve altındaki şubeleri görür
  if (user.role === UserRole.SUPER_BRANCH_MANAGER) {
    // user objesi zaten yönetilen şubeleri içermeli
    return user.branches || [];
  }

  // Diğer roller için şube listesi getirmeye gerek yok
  return [];
};

export function useBranches(user: User | null) {
  const token = useAuthStore((state) => state.token);

  return useQuery<Branch[], Error>({
    queryKey: ["branches", user?.id, token],
    queryFn: () => fetchBranches(user),
    enabled: !!user && !!token && (user.role === UserRole.ADMIN || user.role === UserRole.SUPER_BRANCH_MANAGER),
    staleTime: 1000 * 60 * 5, // 5 dakika
  });
}
