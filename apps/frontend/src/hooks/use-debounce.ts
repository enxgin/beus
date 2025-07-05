'use client';

import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Değer değiştiğinde bir zamanlayıcı ayarla
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Bir sonraki etki çalışmadan veya bileşen kaldırılmadan önce zamanlayıcıyı temizle
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]); // Yalnızca değer veya gecikme değiştiğinde yeniden çalıştır

  return debouncedValue;
}
