'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { cookies } from 'next/headers';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

const openCashDaySchema = z.object({
  openingBalance: z.coerce.number().min(0),
  notes: z.string().optional(),
  branchId: z.string(), // Bu formdan gelmeli
});

async function getAuthHeaders() {
  const token = cookies().get('access_token')?.value;
  if (!token) {
    // Gerçek uygulamada burada bir hata fırlatmak veya login'e yönlendirmek daha doğru olur.
    console.warn('Authentication token not found.');
    return { 'Content-Type': 'application/json' };
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
      const errorData = await response.json();
      throw new Error(errorData.message || 'Kasa detayları alınamadı.');
    }

    return await response.json();
  } catch (error: any) {
    console.error('Failed to get cash day details:', error);
    // Frontend'in çökmemesi için boş bir state döndürelim
    return {
      status: 'ERROR',
      currentBalance: 0,
      dailyIncome: 0,
      dailyOutcome: 0,
      netChange: 0,
      transactions: [],
      error: error.message || 'Kasa detayları alınamadı.',
    };
  }
}

export async function openCashDay(values: unknown) {
  const validatedFields = openCashDaySchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: 'Geçersiz alanlar: ' + validatedFields.error.flatten().fieldErrors };
  }

  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/cash-register/open-day`, {
      method: 'POST',
      headers,
      body: JSON.stringify(validatedFields.data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Kasa açılamadı.');
    }

    const result = await response.json();
    revalidatePath('/dashboard/finance/cash-management');
    return { success: 'Kasa başarıyla açıldı!', data: result };
  } catch (error: any) {
    console.error('Failed to open cash day:', error);
    return { error: error.message };
  }
}
