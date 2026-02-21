"use client";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface KeywordCoverageProps {
  covered: string[];
  uncovered: string[];
  percentage: number;
  trafficCovered?: number;
  trafficTotal?: number;
  compact?: boolean;
  className?: string;
}

export function KeywordCoverage({
  covered,
  uncovered,
  percentage,
  trafficCovered,
  trafficTotal,
  compact = false,
  className,
}: KeywordCoverageProps) {
  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          Keyword Coverage
        </span>
        <span className="font-mono font-medium">
          {covered.length}/{covered.length + uncovered.length} ({percentage}%)
        </span>
      </div>

      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-emerald-500 transition-all duration-500"
          style={{ width: `${Math.min(100, percentage)}%` }}
        />
      </div>

      {trafficCovered !== undefined && trafficTotal !== undefined && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Traffic covered</span>
          <span className="font-mono">
            {trafficCovered.toLocaleString()} / {trafficTotal.toLocaleString()}
            {trafficTotal > 0 && (
              <span className="ml-1">
                ({Math.round((trafficCovered / trafficTotal) * 100)}%)
              </span>
            )}
          </span>
        </div>
      )}

      {!compact && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {covered.map((kw) => (
            <Badge
              key={kw}
              variant="outline"
              className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 text-[11px]"
            >
              {kw}
            </Badge>
          ))}
          {uncovered.map((kw) => (
            <Badge
              key={kw}
              variant="outline"
              className="bg-zinc-500/10 text-zinc-500 border-zinc-500/20 text-[11px] opacity-60"
            >
              {kw}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
