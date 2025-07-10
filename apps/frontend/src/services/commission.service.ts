import api from '@/lib/api';
import { CommissionRuleFormValues } from '@/lib/schemas/commission-rule.schema';

// Define types based on backend Prisma models
export interface CommissionRule {
  id: string;
  name: string;
  type: 'PERCENTAGE' | 'FIXED_AMOUNT';
  rate: number;
  fixedAmount: number;
  description?: string;
  startDate: string;
  endDate?: string;
  branchId: string;
  branch?: { id: string; name: string };
  staff?: { id: string; name: string; email: string }[];
  createdAt: string;
  updatedAt: string;
  // Yeni hiyerarşik sistem alanları
  ruleType: 'GENERAL' | 'SERVICE_SPECIFIC' | 'STAFF_SPECIFIC';
  serviceId?: string;
  staffId?: string;
  isActive: boolean;
  service?: { id: string; name: string };
  staffMember?: { id: string; name: string; email: string };
  // Eski alanlar - geriye uyumluluk için
  value?: number;
  isGlobal?: boolean;
  userId?: string;
  user?: { id: string; name: string };
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
  // Yeni hiyerarşik sistem için ana endpoint kullan
  const response = await api.post('/commission-rules', data);
  return response.data;
};

// Geriye uyumluluk için eski endpoint'ler
export const createGlobalCommissionRule = async (data: CommissionRuleFormValues): Promise<CommissionRule> => {
  const response = await api.post('/commission-rules/global', data);
  return response.data;
};

export const createServiceCommissionRule = async (data: CommissionRuleFormValues): Promise<CommissionRule> => {
  const response = await api.post('/commission-rules/service', data);
  return response.data;
};

export const createUserCommissionRule = async (data: CommissionRuleFormValues): Promise<CommissionRule> => {
  const response = await api.post('/commission-rules/user', data);
  return response.data;
};

export const updateCommissionRule = async (id: string, data: CommissionRuleFormValues): Promise<CommissionRule> => {
  const response = await api.patch(`/commission-rules/${id}`, data);
  return response.data;
};

export const deleteCommissionRule = async (id: string): Promise<void> => {
  await api.delete(`/commission-rules/${id}`);
};
