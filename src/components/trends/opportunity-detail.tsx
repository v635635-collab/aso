"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { GapIndicator } from "@/components/trends/gap-indicator";
import { Sparkles, Rocket, TrendingUp, Eye, CheckCircle2, XCircle, Loader2 } from "lucide-react";

interface OpportunityDetailProps {
  opportunity: {
    id: string;
    status: string;
    trendQuery: string;
    trendCategory: string;
    geo: string;
    interestScore: number;
    changePercent: number;
    isBreakout: boolean;
    suggestedNiche: string | null;
    suggestedKeywords: unknown;
    appStoreGap: number | null;
    estimatedTraffic: number | null;
    competitionLevel: string | null;
    aiAnalysis: string | null;
    aiRecommendation: string | null;
    confidenceScore: number | null;
    matchedKeywordIds: string[];
    notes: string | null;
    analyzedAt: string | null;
    createdAt: string;
  };
  onStatusChange: (status: string) => void;
  statusLoading?: boolean;
}

export function OpportunityDetail({
  opportunity: o,
  onStatusChange,
  statusLoading,
}: OpportunityDetailProps) {
  const keywords: string[] = Array.isArray(o.suggestedKeywords)
    ? (o.suggestedKeywords as string[])
    : [];

  const seedParam = keywords.length > 0
    ? `?seed=${encodeURIComponent(keywords.join(","))}`
    : "";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight">{o.trendQuery}</h1>
            <StatusBadge status={o.status} />
            {o.isBreakout && (
              <Badge className="bg-violet-500/15 text-violet-700 dark:text-violet-400 border-violet-500/25" variant="outline">
                <TrendingUp className="mr-1 size-3" />
                Breakout
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {o.trendCategory} · {o.geo || "Global"} · Created{" "}
            {new Date(o.createdAt).toLocaleDateString()}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onStatusChange("REVIEWING")}
            disabled={statusLoading || o.status === "REVIEWING"}
          >
            {statusLoading ? <Loader2 className="mr-1 size-3 animate-spin" /> : <Eye className="mr-1 size-3" />}
            Reviewing
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onStatusChange("ACTIONABLE")}
            disabled={statusLoading || o.status === "ACTIONABLE"}
            className="border-emerald-500/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10"
          >
            {statusLoading ? <Loader2 className="mr-1 size-3 animate-spin" /> : <CheckCircle2 className="mr-1 size-3" />}
            Actionable
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onStatusChange("DISMISSED")}
            disabled={statusLoading || o.status === "DISMISSED"}
            className="border-red-500/30 text-red-700 dark:text-red-400 hover:bg-red-500/10"
          >
            {statusLoading ? <Loader2 className="mr-1 size-3 animate-spin" /> : <XCircle className="mr-1 size-3" />}
            Dismiss
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground mb-1">Interest Score</p>
            <p className="text-2xl font-bold">{o.interestScore}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground mb-1">Change</p>
            <p className={`text-2xl font-bold ${
              o.changePercent > 0
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-red-600 dark:text-red-400"
            }`}>
              {o.changePercent > 0 && "+"}
              {o.changePercent.toFixed(1)}%
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground mb-1">Confidence</p>
            <p className="text-2xl font-bold">
              {o.confidenceScore != null ? `${(o.confidenceScore * 100).toFixed(0)}%` : "N/A"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground mb-1">Est. Traffic</p>
            <p className="text-2xl font-bold">
              {o.estimatedTraffic != null ? o.estimatedTraffic.toLocaleString() : "N/A"}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <div className="rounded-md bg-primary/10 p-1.5">
              <Sparkles className="size-4 text-primary" />
            </div>
            App Store Gap
          </CardTitle>
        </CardHeader>
        <CardContent>
          <GapIndicator value={o.appStoreGap} className="mb-3" />
          {o.competitionLevel && (
            <p className="text-sm text-muted-foreground">
              Competition Level: <span className="font-medium text-foreground">{o.competitionLevel}</span>
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <div className="rounded-md bg-primary/10 p-1.5">
              <Sparkles className="size-4 text-primary" />
            </div>
            AI Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {o.suggestedNiche && (
            <div>
              <p className="text-xs text-muted-foreground mb-1.5">Suggested Niche</p>
              <Badge variant="secondary" className="text-sm">
                {o.suggestedNiche}
              </Badge>
            </div>
          )}

          {keywords.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-1.5">Suggested Keywords</p>
              <div className="flex flex-wrap gap-1.5">
                {keywords.map((kw) => (
                  <Badge key={kw} variant="outline">{kw}</Badge>
                ))}
              </div>
            </div>
          )}

          {o.aiAnalysis && (
            <div>
              <p className="text-xs text-muted-foreground mb-1.5">Analysis</p>
              <p className="text-sm leading-relaxed">{o.aiAnalysis}</p>
            </div>
          )}

          {o.aiRecommendation && (
            <div>
              <p className="text-xs text-muted-foreground mb-1.5">Recommendation</p>
              <p className="text-sm leading-relaxed">{o.aiRecommendation}</p>
            </div>
          )}

          {o.analyzedAt && (
            <p className="text-xs text-muted-foreground">
              Analyzed on {new Date(o.analyzedAt).toLocaleDateString()}
            </p>
          )}
        </CardContent>
      </Card>

      {o.matchedKeywordIds.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Matched Existing Keywords</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1.5">
              {o.matchedKeywordIds.map((kid) => (
                <Badge key={kid} variant="outline" className="font-mono text-xs">
                  {kid}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end">
        <Button asChild>
          <Link href={`/research/new${seedParam}`}>
            <Rocket className="mr-2 size-4" />
            Start Research
          </Link>
        </Button>
      </div>
    </div>
  );
}
