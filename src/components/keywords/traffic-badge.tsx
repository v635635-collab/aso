import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface TrafficBadgeProps {
  score: number | null | undefined;
  className?: string;
}

export function TrafficBadge({ score, className }: TrafficBadgeProps) {
  const value = score ?? 0;

  let level: string;
  let colors: string;

  if (value > 50) {
    level = 'High';
    colors = 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/25';
  } else if (value >= 20) {
    level = 'Medium';
    colors = 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/25';
  } else {
    level = 'Low';
    colors = 'bg-zinc-500/15 text-zinc-700 dark:text-zinc-400 border-zinc-500/25';
  }

  return (
    <Badge variant="outline" className={cn(colors, className)}>
      {value} · {level}
    </Badge>
  );
}
