'use client';

import { Skeleton } from '@/components/ui/skeleton';

export function CalendarSkeleton() {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-8 w-40" />
      </div>
      
      {/* Calendar Grid */}
      <div className="space-y-2">
        {/* Weekdays Header */}
        <div className="flex gap-1">
          {/* Personel Başlığı */}
          <Skeleton className="h-8 w-[15%]" />
          
          {/* Günler */}
          {[...Array(7)].map((_, i) => (
            <Skeleton key={i} className="h-8 flex-1" />
          ))}
        </div>
        
        {/* Time Slots - 12 saatlik çalışma günü için */}
        {[...Array(12)].map((_, rowIndex) => (
          <div key={rowIndex} className="flex gap-1">
            {/* Saat başlığı */}
            <Skeleton className="h-20 w-[15%]" />
            
            {/* Her gün için hücreler */}
            {[...Array(7)].map((_, colIndex) => (
              <Skeleton key={colIndex} className="h-20 flex-1" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}