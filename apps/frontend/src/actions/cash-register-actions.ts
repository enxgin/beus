'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { CashLogType, CashMovementCategory } from '@prisma/client';

// API URL'sini düzeltiyoruz - global prefix'i iki kez eklememek için
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://beus.onrender.com';

const openCashDaySchema = z.object({
  openingBalance: z.coerce.number().min(0),
  notes: z.string().optional(),
  branchId: z.string(),
});

const createManualCashMovementSchema = z.object({
  type: z.enum([CashLogType.MANUAL_IN, CashLogType.MANUAL_OUT]),
  category: z.nativeEnum(CashMovementCategory),
  amount: z.coerce.number().positive(),
  description: z.string().min(3),
  branchId: z.string(),
});

// Token null olabilir, bu durumu daha zarif bir şekilde ele alıyoruz
function getAuthHeaders(token: string | null | undefined) {
  if (!token) {
    const errorMessage = 'Authentication token was not provided. Please log in again.';
    console.error(errorMessage);
    throw new Error(errorMessage);
  }

  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
}

// Token istemci tarafından bir parametre olarak geçirilecek
export async function getCashDayDetails(token: string | null | undefined, date: string, branchId: string) {
  if (!date || !branchId) return { error: 'Tarih ve şube IDsi gereklidir.' };

  try {
    // Token yoksa, kullanıcıya daha açıklayıcı bir hata mesajı gösteriyoruz
    if (!token) {
      return {
        status: 'ERROR',
        currentBalance: 0,
        dailyIncome: 0,
        dailyOutcome: 0,
        netChange: 0,
        transactions: [],
        error: 'Oturum bilgisi bulunamadı. Lütfen tekrar giriş yapın.',
      };
    }

    const headers = getAuthHeaders(token);
    const response = await fetch(`${API_URL}/api/v1/cash-register/day-details?date=${date}&branchId=${branchId}`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
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

// Token istemci tarafından bir parametre olarak geçirilecek
export async function openCashDay(token: string | null | undefined, values: unknown) {
  const validatedFields = openCashDaySchema.safeParse(values);

  if (!validatedFields.success) {
    const errorMessages = validatedFields.error.flatten().fieldErrors;
    console.error('Invalid fields for openCashDay:', errorMessages);
    return { error: 'Geçersiz alanlar: ' + JSON.stringify(errorMessages) };
  }

  try {
    // Token yoksa, kullanıcıya daha açıklayıcı bir hata mesajı gösteriyoruz
    if (!token) {
      return { error: 'Oturum bilgisi bulunamadı. Lütfen tekrar giriş yapın.' };
    }

    const headers = getAuthHeaders(token);
    const response = await fetch(`${API_URL}/api/v1/cash-register/open-day`, {
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

export async function createManualCashMovement(token: string | null | undefined, values: unknown) {
  const validatedFields = createManualCashMovementSchema.safeParse(values);

  if (!validatedFields.success) {
    const errorMessages = validatedFields.error.flatten().fieldErrors;
    console.error('Invalid fields for createManualCashMovement:', errorMessages);
    return { error: 'Geçersiz alanlar: ' + JSON.stringify(errorMessages) };
  }

  try {
    if (!token) {
      return { error: 'Oturum bilgisi bulunamadı. Lütfen tekrar giriş yapın.' };
    }

    const headers = getAuthHeaders(token);
    const response = await fetch(`${API_URL}/api/v1/cash-register/transactions`, {
      method: 'POST',
      headers,
      body: JSON.stringify(validatedFields.data),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Failed to create manual cash movement. Status: ${response.status}, Body: ${errorText}`);
      throw new Error(`Manuel hareket oluşturulamadı. Sunucu yanıtı: ${response.status}`);
    }

    const result = await response.json();
    revalidatePath('/dashboard/finance/cash-management');
    return { success: 'Manuel hareket başarıyla oluşturuldu!', data: result };
  } catch (error: any) {
    console.error('Exception in createManualCashMovement:', error);
    return { error: error.message };
  }
}