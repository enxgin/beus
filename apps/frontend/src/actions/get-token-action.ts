'use server';

import { cookies } from 'next/headers';

/**
 * Bu sunucu eylemi, kimlik doğrulama token'ını güvenli bir şekilde okur.
 * Hafıza kayıtlarımıza göre, token ismi 'accessToken'dan 'token'a standartlaştırıldı.
 * Ancak, eski kodlarda hala 'access_token' kullanılıyor olabilir.
 * Bu fonksiyon, her iki ismi de kontrol eder ve bulduğu token'ı döndürür.
 */
export async function getToken() {
  // Next.js'in önerdiği şekilde, cookieStore'u await ile alıyoruz
  const cookieStore = await cookies();
  
  // Standartlaştırılmış isim: 'token'
  let token = cookieStore.get('token')?.value;
  
  // Eğer 'token' bulunamazsa, eski isim olan 'access_token'ı kontrol ediyoruz
  if (!token) {
    token = cookieStore.get('access_token')?.value;
    if (token) {
      console.log("Eski token ismi 'access_token' kullanılıyor. Lütfen 'token' olarak standartlaştırın.");
    }
  }
  
  // Token yoksa null döndürüyoruz, böylece çağıran kod buna göre işlem yapabilir
  return token || null;
}

/**
 * Bu yardımcı fonksiyon, hangi cookie isminin kullanıldığını kontrol eder.
 * Sadece debug amaçlıdır ve normal işleyişte kullanılmaz.
 */
export async function checkAuthCookies() {
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();
  
  const cookieNames = allCookies.map(cookie => cookie.name);
  const hasToken = cookieNames.includes('token');
  const hasAccessToken = cookieNames.includes('access_token');
  
  return {
    allCookieNames: cookieNames,
    hasToken,
    hasAccessToken,
    message: `Token: ${hasToken ? 'Var' : 'Yok'}, AccessToken: ${hasAccessToken ? 'Var' : 'Yok'}`
  };
}