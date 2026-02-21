import { cn } from "@/lib/utils";

interface GapIndicatorProps {
  value: number | null | undefined;
  showLabel?: boolean;
  className?: string;
}

function getGapColor(value: number): string {
  if (value >= 0.7) return "bg-emerald-500";
  if (value >= 0.4) return "bg-amber-500";
  return "bg-red-500";
}

function getGapLabel(value: number): string {
  if (value >= 0.7) return "High Gap";
  if (value >= 0.4) return "Medium Gap";
  return "Low Gap";
}

export function GapIndicator({
  value,
  showLabel = true,
  className,
}: GapIndicatorProps) {
  if (value == null) {
    return (
      <span className="text-xs text-muted-foreground">N/A</span>
    );
  }

  const clamped = Math.max(0, Math.min(1, value));
  const pct = Math.round(clamped * 100);

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="relative h-2 w-20 rounded-full bg-muted overflow-hidden">
        <div
          className={cn("absolute inset-y-0 left-0 rounded-full transition-all", getGapColor(clamped))}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-mono tabular-nums">{clamped.toFixed(2)}</span>
      {showLabel && (
        <span className={cn(
          "text-[10px] font-medium",
          clamped >= 0.7 && "text-emerald-600 dark:text-emerald-400",
          clamped >= 0.4 && clamped < 0.7 && "text-amber-600 dark:text-amber-400",
          clamped < 0.4 && "text-red-600 dark:text-red-400",
        )}>
          {getGapLabel(clamped)}
        </span>
      )}
    </div>
  );
}
