'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { cookies } from 'next/headers';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

const openCashDaySchema = z.object({
  openingBalance: z.coerce.number().min(0),
  notes: z.string().optional(),
  branchId: z.string(), // Bu formdan gelmeli
});

async function getAuthHeaders() {
  // Next.js dinamik fonksiyon kuralına uymak için önce cookieStore'u alıyoruz.
  const cookieStore = cookies();
  // Hafıza kaydına göre standartlaştırılmış token ismini ('token') kullanıyoruz.
  const token = cookieStore.get('token')?.value;

  if (!token) {
    // Token yoksa, isteğin başarısız olacağı kesin olduğu için hata fırlatmak en doğrusu.
    const errorMessage = 'Authentication token not found. Please log in again.';
    console.error(errorMessage);
    throw new Error(errorMessage);
  }

  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
}

export async function getCashDayDetails(date: string, branchId: string) {
  if (!date || !branchId) return { error: 'Tarih ve şube IDsi gereklidir.' };

  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/cash-register/day-details?date=${date}&branchId=${branchId}`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      // Hata durumunda daha detaylı bilgi loglayalım.
      const errorText = await response.text();
      console.error(`Failed to get cash day details. Status: ${response.status}, Body: ${errorText}`);
      throw new Error(`Kasa detayları alınamadı. Sunucu yanıtı: ${response.status}`);
    }

    return await response.json();
  } catch (error: any) {
    console.error('Exception in getCashDayDetails:', error);
    return {
      status: 'ERROR',
      currentBalance: 0,
      dailyIncome: 0,
      dailyOutcome: 0,
      netChange: 0,
      transactions: [],
      error: error.message || 'Bilinmeyen bir hata oluştu.',
    };
  }
}

export async function openCashDay(values: unknown) {
  const validatedFields = openCashDaySchema.safeParse(values);

  if (!validatedFields.success) {
    const errorMessages = validatedFields.error.flatten().fieldErrors;
    console.error('Invalid fields for openCashDay:', errorMessages);
    return { error: 'Geçersiz alanlar: ' + JSON.stringify(errorMessages) };
  }

  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/cash-register/open-day`, {
      method: 'POST',
      headers,
      body: JSON.stringify(validatedFields.data),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Failed to open cash day. Status: ${response.status}, Body: ${errorText}`);
      throw new Error(`Kasa açılamadı. Sunucu yanıtı: ${response.status}`);
    }

    const result = await response.json();
    revalidatePath('/dashboard/finance/cash-management');
    return { success: 'Kasa başarıyla açıldı!', data: result };
  } catch (error: any) {
    console.error('Exception in openCashDay:', error);
    return { error: error.message };
  }
}
