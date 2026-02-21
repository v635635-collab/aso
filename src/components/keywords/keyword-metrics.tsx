import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { TrafficBadge } from './traffic-badge';

interface KeywordMetricsProps {
  trafficScore?: number | null;
  sap?: number | null;
  competition?: number | null;
  difficulty?: number | null;
  layout?: 'inline' | 'grid';
  className?: string;
}

function getDifficultyColor(value: number): string {
  if (value >= 70) return 'bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/25';
  if (value >= 40) return 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/25';
  return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/25';
}

function getDifficultyLabel(value: number): string {
  if (value >= 70) return 'Hard';
  if (value >= 40) return 'Medium';
  return 'Easy';
}

export function KeywordMetrics({
  trafficScore,
  sap,
  competition,
  difficulty,
  layout = 'inline',
  className,
}: KeywordMetricsProps) {
  return (
    <div
      className={cn(
        layout === 'inline' ? 'flex items-center gap-2 flex-wrap' : 'grid grid-cols-2 gap-2',
        className,
      )}
    >
      <TrafficBadge score={trafficScore} />

      {sap != null && (
        <Badge variant="outline" className="bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/25">
          SAP: {sap.toFixed(1)}
        </Badge>
      )}

      {competition != null && (
        <Badge variant="outline" className="bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-500/25">
          Comp: {competition.toFixed(1)}
        </Badge>
      )}

      {difficulty != null && (
        <Badge variant="outline" className={getDifficultyColor(difficulty)}>
          {getDifficultyLabel(difficulty)}: {difficulty.toFixed(0)}
        </Badge>
      )}
    </div>
  );
}
