import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Branch } from "@/types";
import { User, UserRole } from "@/types/user";
import { useAuthStore } from "@/stores/auth.store";

// Backend zaten rol bazlı yetkilendirme yaptığı için bu fonksiyon basitleştirildi.
const fetchBranches = async (): Promise<Branch[]> => {
  const response = await api.get("/branches");
  // API cevabı { data: [], total: number } formatında olabilir, kontrol edelim.
  return response.data.data || response.data;
};

export function useBranches(user: User | null) {
  const token = useAuthStore((state) => state.token);

  return useQuery<Branch[], Error>({
    queryKey: ["branches", user?.id, token],
    queryFn: fetchBranches,
    enabled: !!user && !!token && (user.role === UserRole.ADMIN || user.role === UserRole.SUPER_BRANCH_MANAGER),
    staleTime: 1000 * 60 * 5, // 5 dakika
  });
}
