export enum UserRole {
  ADMIN = 'ADMIN',
  SUPER_BRANCH_MANAGER = 'SUPER_BRANCH_MANAGER',
  BRANCH_MANAGER = 'BRANCH_MANAGER',
  STAFF = 'STAFF',
  RECEPTION = 'RECEPTION',
  CUSTOMER = 'CUSTOMER',
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  branch: {
    id: string;
    name: string;
  } | null;
  // branchId özelliği için getter (geriye uyumluluk için)
  branchId?: string;
}
