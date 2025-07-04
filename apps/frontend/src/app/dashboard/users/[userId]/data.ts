import { api } from '../../../../lib/api';

// Kullanıcı rollerini içeren enum
export enum UserRole {
  ADMIN = 'ADMIN',
  SUPER_BRANCH_MANAGER = 'SUPER_BRANCH_MANAGER',
  BRANCH_MANAGER = 'BRANCH_MANAGER',
  RECEPTION = 'RECEPTION',
  STAFF = 'STAFF',
  CUSTOMER = 'CUSTOMER',
}

// User ve Branch türleri için basit tipler
type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  branchId?: string | null;
  branch?: { id: string; name: string } | null;
  createdAt: string;
  updatedAt: string;
};

type Branch = {
  id: string;
  name: string;
  address?: string | null;
  phone?: string | null;
  description?: string | null;
  parentBranchId?: string | null;
  createdAt?: string | Date;
  updatedAt?: string | Date;
};

// Server Component yerine Client Component için veri çekme fonksiyonu
export const getUserPageData = async (userId: string) => {
  // Roller statik olarak tanımlanır
  const roles = [
    { id: UserRole.ADMIN, name: 'ADMIN' },
    { id: UserRole.SUPER_BRANCH_MANAGER, name: 'SUPER_BRANCH_MANAGER' },
    { id: UserRole.BRANCH_MANAGER, name: 'BRANCH_MANAGER' },
    { id: UserRole.RECEPTION, name: 'RECEPTION' },
    { id: UserRole.STAFF, name: 'STAFF' },
  ];

  try {
    // API'den şubeleri çek
    const branchesResponse = await api.get('/branches');
    // API'nin döndürdüğü formata göre uyarla (items veya data içinde olabilir)
    let rawBranches = Array.isArray(branchesResponse.data)
      ? branchesResponse.data
      : branchesResponse.data?.items || branchesResponse.data?.data || [];
    
    // Gelen şubeleri tam Branch tipine uyacak şekilde dönüştür
    const branches: Branch[] = rawBranches.map(branch => ({
      id: branch.id,
      name: branch.name,
      address: branch.address || null,
      phone: branch.phone || null,
      description: branch.description || null,
      parentBranchId: branch.parentBranchId || null,
      createdAt: branch.createdAt || new Date().toISOString(),
      updatedAt: branch.updatedAt || new Date().toISOString()
    }));

    let user = null;

    // Yeni kullanıcı değilse, kullanıcı verisini API'den çek
    if (userId !== 'new') {
      const userResponse = await api.get(`/users/${userId}`);
      user = userResponse.data;
    }

    return { user, roles, branches };
  } catch (error) {
    console.error('API\'den veri çekilirken hata oluştu:', error);
    // Hata durumunda temel veriyi döndür
    return { user: null, roles, branches: [] };
  }
};
