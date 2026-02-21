"use client";

import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/shared/status-badge";
import { KeywordCoverage } from "./keyword-coverage";

interface TitleVariant {
  id: string;
  title: string;
  subtitle?: string | null;
  charCount: number;
  keywordsCovered: string[];
  keywordCount: number;
  trafficCovered: number;
  status: string;
  score?: number | null;
  generatedBy: string;
}

interface TitleComparisonProps {
  variants: TitleVariant[];
  allKeywords?: string[];
  className?: string;
}

export function TitleComparison({
  variants,
  allKeywords: allKeywordsProp,
  className,
}: TitleComparisonProps) {
  const allKeywords = allKeywordsProp ?? deriveAllKeywords(variants);

  return (
    <div className={cn("space-y-6", className)}>
      <div
        className={cn(
          "grid gap-4",
          variants.length === 2 && "md:grid-cols-2",
          variants.length >= 3 && "md:grid-cols-3",
        )}
      >
        {variants.map((v) => {
          const uncovered = allKeywords.filter(
            (kw) => !v.keywordsCovered.includes(kw)
          );
          const coverage = allKeywords.length > 0
            ? Math.round((v.keywordsCovered.length / allKeywords.length) * 100)
            : 0;

          return (
            <Card key={v.id} className="flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <StatusBadge status={v.status} size="sm" />
                  {v.score != null && (
                    <span className="text-sm font-mono font-medium">
                      {v.score.toFixed(1)}
                    </span>
                  )}
                </div>
                <CardTitle className="text-sm leading-relaxed break-words">
                  {v.title}
                </CardTitle>
                {v.subtitle && (
                  <p className="text-xs text-muted-foreground">{v.subtitle}</p>
                )}
              </CardHeader>
              <CardContent className="flex-1 space-y-4">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <MetricCell label="Chars" value={`${v.charCount}/200`} />
                  <MetricCell label="Keywords" value={String(v.keywordCount)} />
                  <MetricCell label="Traffic" value={v.trafficCovered.toLocaleString()} />
                </div>

                <KeywordCoverage
                  covered={v.keywordsCovered}
                  uncovered={uncovered}
                  percentage={coverage}
                  trafficCovered={v.trafficCovered}
                />
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Keyword Coverage Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {allKeywords.map((kw) => (
              <div key={kw} className="flex items-center gap-2">
                <span className="min-w-[140px] truncate text-sm">{kw}</span>
                <div className="flex gap-1.5">
                  {variants.map((v) => {
                    const has = v.keywordsCovered.includes(kw);
                    return (
                      <Badge
                        key={v.id}
                        variant="outline"
                        className={cn(
                          "text-[10px] px-1.5",
                          has
                            ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/25"
                            : "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
                        )}
                      >
                        {has ? "Yes" : "No"}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function MetricCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-muted/50 p-2">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className="text-sm font-mono font-medium">{value}</p>
    </div>
  );
}

function deriveAllKeywords(variants: TitleVariant[]): string[] {
  const set = new Set<string>();
  for (const v of variants) {
    for (const kw of v.keywordsCovered) {
      set.add(kw);
    }
  }
  return Array.from(set).sort();
}
