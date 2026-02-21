"use client";

import Link from "next/link";
import { ArrowRight, Sparkles, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { GapIndicator } from "@/components/trends/gap-indicator";

export interface TrendOpportunity {
  id: string;
  status: string;
  trendQuery: string;
  trendCategory: string;
  geo: string;
  interestScore: number;
  changePercent: number;
  isBreakout: boolean;
  suggestedNiche: string | null;
  suggestedKeywords: string[];
  appStoreGap: number | null;
  confidenceScore: number | null;
  aiRecommendation: string | null;
  createdAt: string;
}

interface OpportunityCardProps {
  opportunity: TrendOpportunity;
}

export function OpportunityCard({ opportunity }: OpportunityCardProps) {
  const o = opportunity;
  return (
    <Card className="border-border/50 hover:border-border transition-colors">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold truncate">{o.trendQuery}</h3>
              {o.isBreakout && (
                <Badge className="bg-violet-500/15 text-violet-700 dark:text-violet-400 border-violet-500/25" variant="outline">
                  <TrendingUp className="mr-1 size-3" />
                  Breakout
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {o.trendCategory} · {o.geo || "Global"}
            </p>
          </div>
          <StatusBadge status={o.status} />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-3 gap-3 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Interest</p>
            <p className="font-mono font-medium">{o.interestScore}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Change</p>
            <p className={o.changePercent > 0
              ? "text-emerald-600 dark:text-emerald-400 font-medium"
              : "text-red-600 dark:text-red-400 font-medium"
            }>
              {o.changePercent > 0 && "+"}
              {o.changePercent.toFixed(1)}%
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Confidence</p>
            <p className="font-mono font-medium">
              {o.confidenceScore != null ? `${(o.confidenceScore * 100).toFixed(0)}%` : "—"}
            </p>
          </div>
        </div>

        {o.suggestedNiche && (
          <div>
            <p className="text-xs text-muted-foreground mb-1">Suggested Niche</p>
            <Badge variant="secondary">
              <Sparkles className="mr-1 size-3" />
              {o.suggestedNiche}
            </Badge>
          </div>
        )}

        <div>
          <p className="text-xs text-muted-foreground mb-1">App Store Gap</p>
          <GapIndicator value={o.appStoreGap} showLabel={false} />
        </div>

        {o.aiRecommendation && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {o.aiRecommendation}
          </p>
        )}

        <div className="pt-1">
          <Button variant="ghost" size="sm" className="h-7 px-2 -ml-2" asChild>
            <Link href={`/trends/opportunities/${o.id}`}>
              View Details
              <ArrowRight className="ml-1 size-3" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
