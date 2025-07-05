"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Service } from "@/types/service";
import { useAuthStore } from "@/stores/auth.store";

interface ServicesQuery {
  page?: number;
  limit?: number;
  branchId?: string;
  categoryId?: string;
  search?: string;
  orderBy?: string;
}

interface ServicesResponse {
  data: Service[];
  totalCount: number;
}

export function useServices(query: ServicesQuery) {
  const token = useAuthStore((state) => state.token);

  const queryKey = ["services", query, token];

  const queryFn = async (): Promise<ServicesResponse> => {
    const params = new URLSearchParams();

    // Backend `skip` bekliyor, bu yüzden `page` ve `limit`'ten hesaplıyoruz.
    if (query.page && query.limit) {
      params.append("skip", ((query.page - 1) * query.limit).toString());
      params.append("take", query.limit.toString());
    } else {
        // Sayfalama bilgisi yoksa varsayılan değerleri gönderebiliriz
        params.append("skip", "0");
        params.append("take", "10");
    }

    if (query.branchId) {
      params.append("branchId", query.branchId);
    }
    if (query.categoryId) {
      params.append("categoryId", query.categoryId);
    }
    if (query.search) {
      params.append("search", query.search);
    }
    if (query.orderBy) {
      params.append("orderBy", query.orderBy);
    }

    const response = await api.get(`/services?${params.toString()}`);
    return response.data;
  };

  return useQuery<ServicesResponse>({
    queryKey,
    queryFn,
    enabled: !!token,
    placeholderData: (previousData) => previousData, // Veri yeniden çekilirken eski veriyi tut
  })
}
