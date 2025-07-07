import api from '@/lib/api';

export interface SelectOption {
  value: string;
  label: string;
}

interface User {
  id: string;
  name: string;
}

interface Service {
  id: string;
  name: string;
}

export const getStaffForSelect = async (): Promise<SelectOption[]> => {
  const response = await api.get('/users', { params: { role: 'STAFF', limit: 1000 } });
  const users = response.data.data || response.data;
  return users.map((user: User) => ({
    value: user.id,
    label: user.name,
  }));
};

export const getServicesForSelect = async (): Promise<SelectOption[]> => {
  const response = await api.get('/services', { params: { limit: 1000, ignoreBranchFilter: 'true' } });
  const services = response.data.data || response.data;
  return services.map((service: Service) => ({
    value: service.id,
    label: service.name,
  }));
};
