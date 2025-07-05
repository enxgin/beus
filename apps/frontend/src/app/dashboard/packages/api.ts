import api from "@/lib/api";
import type { Package, Service, CustomerPackage, CreateCustomerPackageDto } from "@/types";

// Get all packages
export const getPackages = async (): Promise<Package[]> => {
  const response = await api.get<Package[]>('/packages');
  return response.data;
};

// Get a single package by ID
export const getPackage = async (id: string): Promise<Package> => {
  const response = await api.get<Package>(`/packages/${id}`);
  return response.data;
};

// Update a package
export const updatePackage = async (id: string, data: Partial<Package>): Promise<Package> => {
  const response = await api.patch<Package>(`/packages/${id}`, data);
  return response.data;
};

// Delete a package
export const deletePackage = async (id: string): Promise<void> => {
  await api.delete(`/packages/${id}`);
};

// Get services by branch ID
export const getServices = async (branchId: string) => {
  const response = await api.get(`/services?branchId=${branchId}`);
  return response.data;
};

// Get all packages by branch ID
export const getPackagesByBranch = async (branchId: string): Promise<Package[]> => {
  const response = await api.get<Package[]>(`/packages?branchId=${branchId}`);
  return response.data;
};

// Create a customer package (sell a package to a customer)
export const createCustomerPackage = async (data: CreateCustomerPackageDto): Promise<CustomerPackage> => {
  const response = await api.post<CustomerPackage>('/packages/customer', data);
  return response.data;
};

// Get customer packages
export const getCustomerPackages = async (params: { 
  skip?: number; 
  take?: number; 
  customerId?: string; 
  active?: boolean 
} = {}): Promise<{ data: CustomerPackage[]; total: number }> => {
  let url = '/packages/customer?';
  
  if (params.skip !== undefined) url += `skip=${params.skip}&`;
  if (params.take !== undefined) url += `take=${params.take}&`;
  if (params.customerId) url += `customerId=${params.customerId}&`;
  if (params.active !== undefined) url += `active=${params.active}`;
  
  const response = await api.get<{ data: CustomerPackage[]; total: number }>(url);
  return response.data;
};

// Get a customer package by ID
export const getCustomerPackage = async (id: string): Promise<CustomerPackage> => {
  const response = await api.get<CustomerPackage>(`/packages/customer/${id}`);
  return response.data;
};

// Delete a customer package
export const deleteCustomerPackage = async (id: string): Promise<void> => {
  await api.delete(`/packages/customer/${id}`);
};