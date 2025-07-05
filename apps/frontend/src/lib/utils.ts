import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Bir sayıyı Türk Lirası formatında formatlayan fonksiyon
 * @param amount Formatlanacak miktar
 * @returns Formatlı Türk Lirası değeri (örn: ₺1.234,56)
 */
export function formatTurkishLira(amount: number): string {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 2
  }).format(amount);
}
