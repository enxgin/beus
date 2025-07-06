"use server";

// Not: Bu fonksiyon artık kullanılmıyor. Veri çekme işlemleri hook'lar üzerinden yapılıyor.
// Ancak referans hatalarını önlemek için boş bir fonksiyon bırakıyoruz.
export async function getUserPageData(userId: string) {
  return { user: null };
}