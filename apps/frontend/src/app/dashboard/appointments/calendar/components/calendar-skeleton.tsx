'use client';

import { Skeleton } from '@/components/ui/skeleton';

export function CalendarSkeleton() {
  return (
    <div className="w-full h-full">
      {/* Özel takvim kontrolleri skeleton */}
      <div className="mb-4 flex flex-col space-y-2 sm:space-y-0 sm:flex-row sm:justify-between sm:items-center">
        <div className="flex justify-between items-center sm:w-auto sm:flex-1">
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-20" />
          </div>
          
          <Skeleton className="h-6 w-32 sm:w-48 sm:h-7 mx-auto" />
          
          <div className="flex gap-1 sm:gap-2">
            <Skeleton className="h-8 w-12 sm:w-16" />
            <Skeleton className="h-8 w-12 sm:w-16" />
            <Skeleton className="h-8 w-12 sm:w-16" />
          </div>
        </div>
      </div>
      
      {/* Takvim ızgara skeleton */}
      <div className="mt-6 space-y-1">
        {/* Üst başlık satırı */}
        <div className="flex">
          <Skeleton className="h-10 w-[15%] mr-1" />
          <div className="flex-1 flex gap-1">
            {[...Array(7)].map((_, i) => (
              <Skeleton key={i} className="h-10 flex-1" />
            ))}
          </div>
        </div>
        
        {/* Personel satırları */}
        {[...Array(3)].map((_, staffIndex) => (
          <div key={staffIndex} className="mt-4">
            {/* Personel başlığı */}
            <Skeleton className="h-8 w-full mb-2" />
            
            {/* Saat dilimleri */}
            {[...Array(8)].map((_, rowIndex) => (
              <div key={rowIndex} className="flex mb-1">
                {/* Saat başlığı */}
                <Skeleton className="h-16 w-[15%] mr-1" />
                
                {/* Zaman hücreleri */}
                <div className="flex-1 flex gap-1">
                  {[...Array(7)].map((_, colIndex) => (
                    <Skeleton key={colIndex} className="h-16 flex-1" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}