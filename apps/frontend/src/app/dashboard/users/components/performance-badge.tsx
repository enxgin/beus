"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface PerformanceBadgeProps {
  score: number;
  className?: string;
}

export const PerformanceBadge = ({ score, className }: PerformanceBadgeProps) => {
  const getPerformanceLevel = (score: number) => {
    if (score >= 70) return { level: 'Yüksek', variant: 'default', color: 'bg-green-500' };
    if (score >= 40) return { level: 'Orta', variant: 'secondary', color: 'bg-yellow-500' };
    return { level: 'Düşük', variant: 'destructive', color: 'bg-red-500' };
  };

  const performance = getPerformanceLevel(score);

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className={cn("w-2 h-2 rounded-full", performance.color)} />
      <Badge variant={performance.variant as any} className="text-xs">
        {performance.level} ({score})
      </Badge>
    </div>
  );
};