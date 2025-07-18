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
  try {
    console.log('Hizmetler getiriliyor...');
    const response = await api.get('/services', { params: { limit: 1000, ignoreBranchFilter: 'true' } });
    console.log('API yanıtı:', response);
    
    const services = response.data.data || response.data;
    console.log('İşlenmiş hizmet verileri:', services);
    
    if (!services || !Array.isArray(services) || services.length === 0) {
      console.warn('Hizmet listesi boş veya dizi değil:', services);
      return [];
    }
    
    return services.map((service: Service) => {
      console.log('Hizmet dönüştürülüyor:', service);
      return {
        value: service.id,
        label: service.name,
      };
    });
  } catch (error) {
    console.error('Hizmet listesi getirilirken hata:', error);
    return [];
  }
};
