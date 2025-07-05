// Package related types
export interface Service {
  id: string;
  name: string;
  price: number;
  duration: number;
  description?: string;
}

export interface PackageService {
  serviceId: string;
  quantity: number;
  id?: string;
  service?: Service;
}

export interface Branch {
  id: string;
  name: string;
}

export interface Package {
  id: string;
  name: string;
  description?: string;
  price: number;
  validityDays: number;
  type: "SESSION" | "TIME";
  commissionRate?: number | null;
  commissionFixed?: number | null;
  totalSessions?: number | null;
  totalMinutes?: number | null;
  branchId?: string;
  branch?: Branch;
  services?: PackageService[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CustomerPackage {
  id: string;
  customerId: string;
  packageId: string;
  package: Package;
  startDate: string;
  endDate: string;
  remainingSessions?: number;
  remainingMinutes?: number;
  isActive: boolean;
  salesCode?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCustomerPackageDto {
  customerId: string;
  packageId: string;
  salesCode?: string;
  notes?: string;
  startDate?: string; // ISO string format
}