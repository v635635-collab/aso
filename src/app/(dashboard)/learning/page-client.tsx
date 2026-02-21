"use client";

import {
  BarChart3,
  Brain,
  Shield,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Lightbulb,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MetricCard } from "@/components/shared/metric-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { useApi } from "@/hooks/use-api";
import { cn } from "@/lib/utils";

interface RiskModelData {
  overallStats: {
    total: number;
    successful: number;
    pessimized: number;
    averageCPI: number;
  };
  nicheStats: Record<string, {
    campaigns: number;
    successRate: number;
    avgDailyInstalls: number;
    avgPessimizationDay: number | null;
  }>;
  recommendations: string[];
}

interface InsightData {
  insights: string[];
  updatedRecords: number;
}

interface LearningRecord {
  id: string;
  nicheSlug: string;
  pushStrategy: string;
  dailyInstalls: number;
  totalInstalls: number;
  durationDays: number;
  outcome: string;
  pessimized: boolean;
  pessimizationDay: number | null;
  lessonsLearned: string | null;
  createdAt: string;
}

export function LearningDashboardClient() {
  const { data: riskModel, loading: riskLoading, mutate: refreshRisk } = useApi<RiskModelData>("/api/learning/risk-model");
  const { data: insightData, loading: insightsLoading, mutate: refreshInsights } = useApi<InsightData>("/api/learning/insights");
  const { data: records, loading: recordsLoading } = useApi<LearningRecord[]>("/api/learning/records?limit=50");

  const stats = riskModel?.overallStats;
  const successRate = stats && stats.total > 0 ? ((stats.successful / stats.total) * 100) : 0;
  const pessRate = stats && stats.total > 0 ? ((stats.pessimized / stats.total) * 100) : 0;

  const nicheEntries = riskModel ? Object.entries(riskModel.nicheStats) : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Learning Engine</h1>
          <p className="text-sm text-muted-foreground">
            Insights from past push campaigns to improve future performance
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => { refreshRisk(); refreshInsights(); }}>
            <RefreshCw className="mr-2 size-3.5" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Campaigns"
          value={stats?.total ?? 0}
          icon={BarChart3}
          loading={riskLoading}
        />
        <MetricCard
          title="Success Rate"
          value={`${successRate.toFixed(0)}%`}
          icon={CheckCircle}
          loading={riskLoading}
        />
        <MetricCard
          title="Pessimization Rate"
          value={`${pessRate.toFixed(0)}%`}
          icon={AlertTriangle}
          loading={riskLoading}
        />
        <MetricCard
          title="Avg CPI"
          value={stats ? `$${stats.averageCPI.toFixed(3)}` : "$0"}
          icon={TrendingUp}
          loading={riskLoading}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="size-4" /> Per-Niche Stats
            </CardTitle>
          </CardHeader>
          <CardContent>
            {riskLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
              </div>
            ) : nicheEntries.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No niche data available yet.</p>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Niche</TableHead>
                      <TableHead className="text-right">Campaigns</TableHead>
                      <TableHead className="text-right">Success</TableHead>
                      <TableHead className="text-right">Avg Daily</TableHead>
                      <TableHead className="text-right">Pess. Day</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {nicheEntries.map(([niche, ns]) => (
                      <TableRow key={niche}>
                        <TableCell className="font-medium">{niche}</TableCell>
                        <TableCell className="text-right">{ns.campaigns}</TableCell>
                        <TableCell className="text-right">
                          <span className={cn(
                            "font-medium",
                            ns.successRate >= 0.7 ? "text-emerald-600" :
                            ns.successRate >= 0.4 ? "text-amber-600" : "text-red-600"
                          )}>
                            {(ns.successRate * 100).toFixed(0)}%
                          </span>
                        </TableCell>
                        <TableCell className="text-right">{ns.avgDailyInstalls}</TableCell>
                        <TableCell className="text-right">
                          {ns.avgPessimizationDay !== null ? `Day ${ns.avgPessimizationDay}` : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Lightbulb className="size-4" /> AI Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            {insightsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
              </div>
            ) : insightData?.insights && insightData.insights.length > 0 ? (
              <div className="space-y-3">
                {insightData.insights.map((insight, idx) => (
                  <div
                    key={idx}
                    className="flex gap-3 rounded-lg border p-3"
                  >
                    <Brain className="size-4 text-primary shrink-0 mt-0.5" />
                    <p className="text-sm leading-relaxed">{insight}</p>
                  </div>
                ))}
                {insightData.updatedRecords > 0 && (
                  <p className="text-xs text-muted-foreground text-center">
                    Updated {insightData.updatedRecords} learning records with new lessons.
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No insights available yet. Run campaigns to generate data.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="size-4" /> Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          {riskLoading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : riskModel?.recommendations && riskModel.recommendations.length > 0 ? (
            <div className="space-y-2">
              {riskModel.recommendations.map((rec, idx) => (
                <div key={idx} className="flex items-start gap-3 rounded-lg bg-muted/50 p-3">
                  <div className="flex items-center justify-center size-6 rounded-full bg-primary/10 text-xs font-medium text-primary shrink-0">
                    {idx + 1}
                  </div>
                  <p className="text-sm leading-relaxed">{rec}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">No recommendations yet.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Learning Records</CardTitle>
        </CardHeader>
        <CardContent>
          {recordsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : !records || records.length === 0 ? (
            <EmptyState
              title="No learning records"
              description="Complete campaigns to build learning records that improve future plan generation."
              className="py-8"
            />
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Niche</TableHead>
                    <TableHead>Strategy</TableHead>
                    <TableHead className="text-right">Daily</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Days</TableHead>
                    <TableHead>Outcome</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.nicheSlug}</TableCell>
                      <TableCell>{r.pushStrategy}</TableCell>
                      <TableCell className="text-right">{r.dailyInstalls}</TableCell>
                      <TableCell className="text-right">{r.totalInstalls}</TableCell>
                      <TableCell className="text-right">{r.durationDays}</TableCell>
                      <TableCell>
                        <StatusBadge
                          status={r.outcome}
                          colorMap={{
                            SUCCESS: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/25",
                            PARTIAL: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/25",
                            FAILED: "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/25",
                            PESSIMIZED: "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/25",
                            UNKNOWN: "bg-zinc-500/15 text-zinc-700 dark:text-zinc-400 border-zinc-500/25",
                          }}
                          size="sm"
                        />
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(r.createdAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
