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

/**
 * Bir sayıyı para birimi formatında formatlayan fonksiyon
 * @param amount Formatlanacak miktar
 * @param currency Para birimi kodu (varsayılan: TRY)
 * @param locale Yerel ayar (varsayılan: tr-TR)
 * @returns Formatlı para birimi değeri
 */
export function formatCurrency(amount: number, currency: string = 'TRY', locale: string = 'tr-TR'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2
  }).format(amount);
}
