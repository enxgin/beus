// Customer related types
export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  branchId: string;
  branch?: {
    id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface GetCustomersParams {
  skip?: number;
  take?: number;
  search?: string;
  branchId?: string;
}