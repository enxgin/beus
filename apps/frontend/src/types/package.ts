export enum PackageType {
  SESSION = "session",
  TIME = "time",
}

export interface PackageService {
  serviceId: string;
  quantity: number;
  service?: {
    id: string;
    name: string;
    price: number;
    category?: {
      id: string;
      name: string;
    };
  };
}

export interface Package {
  id: string;
  name: string;
  description?: string;
  price: number;
  validityDays: number;
  branchId?: string;
  branch?: {
    id: string;
    name: string;
  };
  isActive: boolean;
  type: PackageType;
  totalSessions?: number;
  totalMinutes?: number;
  services: PackageService[];
  commissionRate?: number;
  commissionFixed?: number;
  createdAt?: string;
  updatedAt?: string;
}
