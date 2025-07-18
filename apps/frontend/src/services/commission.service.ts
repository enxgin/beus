import api from '@/lib/api';
import { CommissionRuleFormValues } from '@/lib/schemas/commission-rule.schema';

// Define types based on backend Prisma models
export interface CommissionRule {
  id: string;
  type: 'PERCENTAGE' | 'FIXED_AMOUNT';
  value: number;
  description?: string;
  isGlobal: boolean;
  serviceId?: string;
  userId?: string;
  service?: { id: string; name: string };
  user?: { id: string; name: string };
  createdAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface PaginatedCommissionRules extends PaginatedResponse<CommissionRule> {}

export const getCommissionRules = async (params: { page: number; limit: number; }): Promise<PaginatedCommissionRules> => {
  const response = await api.get('/commission-rules', { params });
  return response.data;
}

// Prim Raporları için
export interface Commission {
  id: string;
  amount: number;
  status: 'PENDING' | 'APPROVED' | 'PAID' | 'CANCELED';
  createdAt: string;
  staff: { id: string; name: string; email: string };
  service: { id: string; name: string };
  invoice: { id: string; totalAmount: number; status: string };
  appliedRule?: { id: string; type: string; value: number; description?: string };
}

export interface GetCommissionsParams {
  page?: number;
  limit?: number;
  userId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}

export const getCommissions = async (params: GetCommissionsParams = {}): Promise<PaginatedResponse<Commission>> => {
  const response = await api.get('/commissions', { params });
  return response.data;
};

export const updateCommissionStatus = async ({ id, status }: { id: string; status: Commission['status'] }): Promise<Commission> => {
  const response = await api.patch(`/commissions/${id}/status`, { status });
  return response.data;
};

export const createCommissionRule = async (data: CommissionRuleFormValues): Promise<CommissionRule> => {
  let endpoint = '/commission-rules';
  
  if (data.isGlobal) {
    endpoint = '/commission-rules/global';
  } else if (data.serviceId) {
    endpoint = '/commission-rules/service';
  } else if (data.userId) {
    endpoint = '/commission-rules/user';
  }
  
  const response = await api.post(endpoint, data);
  return response.data;
};

export const updateCommissionRule = async (id: string, data: CommissionRuleFormValues): Promise<CommissionRule> => {
  const response = await api.patch(`/commission-rules/${id}`, data);
  return response.data;
};

export const deleteCommissionRule = async (id: string): Promise<void> => {
  await api.delete(`/commission-rules/${id}`);
};
