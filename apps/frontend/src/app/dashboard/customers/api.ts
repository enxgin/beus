import api from "@/lib/api";
import type { Customer, GetCustomersParams } from "@/types";

// Get all customers with pagination and search
export const getCustomers = async (params: GetCustomersParams = {}): Promise<{ data: Customer[]; total: number }> => {
  const { skip, take, search, branchId } = params;
  let url = "/customers?";
  
  if (skip !== undefined) url += `skip=${skip}&`;
  if (take !== undefined) url += `take=${take}&`;
  if (search) url += `search=${encodeURIComponent(search)}&`;
  if (branchId) url += `branchId=${branchId}`;
  
  const response = await api.get<{ data: Customer[]; total: number }>(url);
  return response.data;
};

// Get customer by ID
export const getCustomerById = async (id: string): Promise<Customer> => {
  const response = await api.get<Customer>(`/customers/${id}`);
  return response.data;
};

// Search customers
export const searchCustomers = async (query: string, branchId?: string): Promise<Customer[]> => {
  try {
    const params: Record<string, string> = { name: query };
    if (branchId) params.branchId = branchId;
    
    console.log('Searching customers with params:', params);
    const response = await api.get('/customers/search', { params });
    console.log('Search customers response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error searching customers:', error);
    return [];
  }
};