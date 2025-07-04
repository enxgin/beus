import { User } from './user';

export interface ServiceCategory {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
}

export interface Branch {
  id: string;
  name: string;
}

export interface StaffService {
  user: Pick<User, 'id' | 'name' | 'email'>;
}

export interface Service {
  id: string;
  name: string;
  duration: number;
  price: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  categoryId: string;
  branchId: string;
  category: ServiceCategory;
  branch: Branch;
  staff: StaffService[];
}
