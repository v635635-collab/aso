"use client";

import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface PositionHeatmapProps {
  data: Array<{
    keyword: string;
    positions: Array<{ date: string; position: number | null }>;
  }>;
}

function getPositionColor(position: number | null): string {
  if (position == null) return "bg-zinc-800/50";
  if (position <= 3) return "bg-emerald-500";
  if (position <= 10) return "bg-emerald-400/80";
  if (position <= 30) return "bg-emerald-300/60 dark:bg-emerald-500/40";
  if (position <= 50) return "bg-amber-400/70 dark:bg-amber-500/50";
  if (position <= 100) return "bg-orange-400/70 dark:bg-orange-500/50";
  return "bg-red-400/70 dark:bg-red-500/50";
}

export function PositionHeatmap({ data }: PositionHeatmapProps) {
  if (data.length === 0) {
    return (
      <Card className="border-border/50">
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          No heatmap data available
        </CardContent>
      </Card>
    );
  }

  const allDates = Array.from(
    new Set(data.flatMap((d) => d.positions.map((p) => p.date)))
  ).sort();

  const visibleDates = allDates.slice(-14);

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Position Heatmap</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr>
                <th className="sticky left-0 bg-card pr-3 text-left font-medium text-muted-foreground min-w-[140px]">
                  Keyword
                </th>
                {visibleDates.map((date) => (
                  <th
                    key={date}
                    className="px-0.5 text-center font-normal text-muted-foreground"
                  >
                    <span className="block rotate-[-45deg] origin-center whitespace-nowrap text-[10px]">
                      {new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row) => {
                const posMap = new Map(row.positions.map((p) => [p.date, p.position]));
                return (
                  <tr key={row.keyword}>
                    <td className="sticky left-0 bg-card pr-3 py-1 font-medium truncate max-w-[140px]">
                      {row.keyword}
                    </td>
                    <TooltipProvider delayDuration={100}>
                      {visibleDates.map((date) => {
                        const pos = posMap.get(date) ?? null;
                        return (
                          <td key={date} className="px-0.5 py-1">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div
                                  className={cn(
                                    "mx-auto h-6 w-6 rounded-sm flex items-center justify-center text-[9px] font-mono cursor-default",
                                    getPositionColor(pos),
                                    pos != null && pos <= 50
                                      ? "text-white dark:text-white"
                                      : "text-foreground/80"
                                  )}
                                >
                                  {pos ?? "—"}
                                </div>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="text-xs">
                                <p className="font-medium">{row.keyword}</p>
                                <p className="text-muted-foreground">
                                  {new Date(date).toLocaleDateString()} — Position:{" "}
                                  {pos != null ? `#${pos}` : "Not indexed"}
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </td>
                        );
                      })}
                    </TooltipProvider>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-center gap-3 text-[10px] text-muted-foreground">
          <span>Legend:</span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-3 w-3 rounded-sm bg-emerald-500" /> 1-3
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-3 w-3 rounded-sm bg-emerald-400/80" /> 4-10
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-3 w-3 rounded-sm bg-emerald-300/60 dark:bg-emerald-500/40" /> 11-30
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-3 w-3 rounded-sm bg-amber-400/70 dark:bg-amber-500/50" /> 31-50
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-3 w-3 rounded-sm bg-orange-400/70 dark:bg-orange-500/50" /> 51-100
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-3 w-3 rounded-sm bg-red-400/70 dark:bg-red-500/50" /> 100+
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-3 w-3 rounded-sm bg-zinc-800/50" /> N/A
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
