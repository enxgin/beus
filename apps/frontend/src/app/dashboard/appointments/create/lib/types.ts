import { z } from 'zod';

// Randevu Formu için Validation Schema
export const appointmentFormSchema = z.object({
  // Adım 1: Müşteri Bilgileri
  customerId: z.string().optional(),
  branchId: z.string({ required_error: 'Şube seçilmesi zorunludur' }),
  customerFirstName: z.string().optional(),
  customerLastName: z.string().optional(),
  customerPhone: z.string().optional(),
  customerEmail: z.string().email().optional().or(z.literal('')),
  
  // Adım 2: Hizmet Bilgileri
  serviceId: z.string().optional(),
  customerPackageId: z.string().optional(),
  duration: z.number().min(5, { message: "Süre en az 5 dakika olmalıdır" }).optional(),
  price: z.number().min(0, { message: "Fiyat 0 veya daha büyük olmalıdır" }).optional(),
  
  // Adım 3: Personel Bilgileri
  staffId: z.string({ required_error: 'Personel seçilmesi zorunludur' }),
  
  // Adım 4: Tarih ve Saat Bilgileri
  appointmentDate: z.string({ required_error: 'Tarih seçilmesi zorunludur' }),
  startTime: z.string({ required_error: 'Başlangıç saati seçilmesi zorunludur' }),
  isRecurring: z.boolean().default(false).optional(),
  recurringType: z.enum(['weekly', 'biweekly', 'monthly']).optional(),
  recurringCount: z.number().min(2).max(12).optional(),
  notes: z.string().optional(),
});

export type AppointmentFormValues = z.infer<typeof appointmentFormSchema>;

// Müşteri türü
export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
}

// Personel türü
export interface Staff {
  id: string;
  name: string;
  services?: string[]; // Personelin sağlayabildiği hizmet ID'leri
}

// Hizmet türü
export interface Service {
  id: string;
  name: string;
  duration: number;
  price: number;
}

// Müşteri paketi türü
export interface CustomerPackage {
  id: string;
  packageName: string;
  remainingSessions: number;
  expiryDate?: string;
}

// Boş zaman dilimi türü
export interface TimeSlot {
  startTime: string;
  endTime: string;
}