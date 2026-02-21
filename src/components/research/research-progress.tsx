'use client';

import { cn } from '@/lib/utils';
import { StatusBadge } from '@/components/shared/status-badge';

interface ResearchProgressProps {
  status: string;
  processedSeeds: number;
  totalSeeds: number;
  foundKeywords: number;
  maxKeywords: number;
  className?: string;
}

export function ResearchProgress({
  status,
  processedSeeds,
  totalSeeds,
  foundKeywords,
  maxKeywords,
  className,
}: ResearchProgressProps) {
  const seedProgress = totalSeeds > 0 ? (processedSeeds / totalSeeds) * 100 : 0;
  const kwProgress = maxKeywords > 0 ? (foundKeywords / maxKeywords) * 100 : 0;

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium">Research Progress</p>
          <StatusBadge status={status} />
        </div>
        <div className="text-right space-y-1">
          <p className="text-2xl font-bold">{foundKeywords}</p>
          <p className="text-xs text-muted-foreground">keywords found</p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Seeds processed</span>
            <span className="font-medium">{processedSeeds} / {totalSeeds}</span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${seedProgress}%` }}
            />
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Keywords found</span>
            <span className="font-medium">{foundKeywords} / {maxKeywords}</span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${Math.min(kwProgress, 100)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
