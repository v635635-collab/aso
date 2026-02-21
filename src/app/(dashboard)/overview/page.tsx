"use client";

import { useRouter } from "next/navigation";
import {
  AppWindow,
  KeyRound,
  Rocket,
  Bell,
  Plus,
  Search,
  Zap,
  TrendingUp,
  TrendingDown,
  ArrowUp,
  ArrowDown,
  Flame,
  Minus,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { MetricCard } from "@/components/shared/metric-card";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorBoundary } from "@/components/shared/error-boundary";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useApi } from "@/hooks/use-api";
import { cn } from "@/lib/utils";

interface PositionChange {
  appName: string;
  keyword: string;
  change: number;
  position: number | null;
  previousPosition: number | null;
}

interface CampaignProgress {
  id: string;
  name: string;
  appName: string;
  status: string;
  installProgress: number;
  budgetProgress: number;
  daysProgress: number;
  completedInstalls: number;
  totalInstalls: number;
}

interface TrendOpp {
  id: string;
  trendQuery: string;
  trendCategory: string;
  interestScore: number;
  changePercent: number;
  isBreakout: boolean;
  suggestedNiche: string | null;
  competitionLevel: string | null;
  estimatedTraffic: number | null;
}

interface OverviewData {
  totalApps: number;
  totalKeywords: number;
  activeCampaigns: number;
  pendingAlerts: number;
  recentActivity: Array<{ type: string; message: string; createdAt: string }>;
  positionChanges: PositionChange[];
  campaignProgress: CampaignProgress[];
  trendOpportunities: TrendOpp[];
  trends: { appsDelta: number; keywordsDelta: number };
}

function ProgressBar({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cn("h-2 w-full rounded-full bg-muted", className)}>
      <div
        className="h-full rounded-full bg-primary transition-all"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

export default function OverviewPage() {
  const router = useRouter();
  const { data, loading, error } = useApi<OverviewData>(
    "/api/analytics/overview"
  );

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        <PageHeader
          title="Dashboard"
          description="Welcome to ASO Engine. Here's an overview of your app store optimization."
        />

        {/* Metric Cards with Trend Arrows */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Total Apps"
            value={data?.totalApps ?? 0}
            icon={AppWindow}
            change={
              data?.trends?.appsDelta !== undefined && data.totalApps > 0
                ? (data.trends.appsDelta / Math.max(1, data.totalApps - data.trends.appsDelta)) * 100
                : undefined
            }
            changeLabel="this week"
            loading={loading}
          />
          <MetricCard
            title="Total Keywords"
            value={data?.totalKeywords ?? 0}
            icon={KeyRound}
            change={
              data?.trends?.keywordsDelta !== undefined && data.totalKeywords > 0
                ? (data.trends.keywordsDelta / Math.max(1, data.totalKeywords - data.trends.keywordsDelta)) * 100
                : undefined
            }
            changeLabel="this week"
            loading={loading}
          />
          <MetricCard
            title="Active Campaigns"
            value={data?.activeCampaigns ?? 0}
            icon={Rocket}
            loading={loading}
          />
          <MetricCard
            title="Alerts"
            value={data?.pendingAlerts ?? 0}
            icon={Bell}
            loading={loading}
          />
        </div>

        {/* Position Changes + Campaign Progress */}
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="size-4 text-primary" />
                Position Changes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!data?.positionChanges?.length ? (
                <EmptyState
                  title="No position changes"
                  description="Position changes will appear here once monitoring starts."
                  className="py-6"
                />
              ) : (
                <div className="space-y-3">
                  {data.positionChanges.map((pc, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm">
                      <div
                        className={cn(
                          "flex items-center justify-center rounded-full p-1.5",
                          pc.change < 0
                            ? "bg-emerald-100 dark:bg-emerald-500/20"
                            : "bg-red-100 dark:bg-red-500/20"
                        )}
                      >
                        {pc.change < 0 ? (
                          <ArrowUp className="size-3 text-emerald-600 dark:text-emerald-400" />
                        ) : pc.change > 0 ? (
                          <ArrowDown className="size-3 text-red-600 dark:text-red-400" />
                        ) : (
                          <Minus className="size-3 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="truncate font-medium">{pc.keyword}</p>
                        <p className="text-xs text-muted-foreground">
                          {pc.appName}
                        </p>
                      </div>
                      <div className="text-right">
                        <span
                          className={cn(
                            "font-semibold tabular-nums",
                            pc.change < 0
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-red-600 dark:text-red-400"
                          )}
                        >
                          {pc.change > 0 ? "+" : ""}
                          {pc.change}
                        </span>
                        <p className="text-xs text-muted-foreground tabular-nums">
                          {pc.previousPosition ?? "—"} → {pc.position ?? "—"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Rocket className="size-4 text-primary" />
                Active Campaign Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!data?.campaignProgress?.length ? (
                <EmptyState
                  title="No active campaigns"
                  description="Campaign progress will appear here once campaigns are running."
                  className="py-6"
                />
              ) : (
                <div className="space-y-4">
                  {data.campaignProgress.map((cp) => (
                    <div key={cp.id} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <div className="min-w-0">
                          <p className="truncate font-medium">{cp.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {cp.appName}
                          </p>
                        </div>
                        <Badge variant="outline" className="shrink-0 ml-2">
                          {cp.status}
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Installs</span>
                          <span className="tabular-nums">
                            {cp.completedInstalls}/{cp.totalInstalls} ({cp.installProgress}%)
                          </span>
                        </div>
                        <ProgressBar value={cp.installProgress} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Trending Opportunities */}
        {(data?.trendOpportunities?.length ?? 0) > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Flame className="size-4 text-orange-500" />
                Trending Opportunities
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-3">
                {data!.trendOpportunities.map((opp) => (
                  <div
                    key={opp.id}
                    className="rounded-lg border p-4 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium text-sm leading-tight">
                        {opp.trendQuery}
                      </p>
                      {opp.isBreakout && (
                        <Badge variant="destructive" className="shrink-0 text-[10px]">
                          Breakout
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <TrendingUp className="size-3" />
                        +{opp.changePercent.toFixed(0)}%
                      </span>
                      <span>Interest: {opp.interestScore}</span>
                      {opp.competitionLevel && (
                        <span>Comp: {opp.competitionLevel}</span>
                      )}
                    </div>
                    {opp.suggestedNiche && (
                      <Badge variant="secondary" className="text-[10px]">
                        {opp.suggestedNiche}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Activity + Quick Actions */}
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {error ? (
                <p className="text-sm text-destructive">
                  Failed to load activity.
                </p>
              ) : !data?.recentActivity?.length ? (
                <EmptyState
                  title="No activity yet"
                  description="Start by adding your first app to see activity here."
                  className="py-6"
                />
              ) : (
                <div className="space-y-3">
                  {data.recentActivity.map((item, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 text-sm"
                    >
                      <div className="mt-0.5 rounded-full bg-muted p-1.5">
                        <Zap className="size-3 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="truncate">{item.message}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(item.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                <Button
                  variant="outline"
                  className="justify-start h-auto py-3"
                  onClick={() => router.push("/apps")}
                >
                  <Plus className="mr-3 size-4 text-blue-500" />
                  <div className="text-left">
                    <div className="font-medium">Add App</div>
                    <div className="text-xs text-muted-foreground">
                      Track a new app from the App Store
                    </div>
                  </div>
                </Button>
                <Button
                  variant="outline"
                  className="justify-start h-auto py-3"
                  onClick={() => router.push("/research")}
                >
                  <Search className="mr-3 size-4 text-emerald-500" />
                  <div className="text-left">
                    <div className="font-medium">Start Research</div>
                    <div className="text-xs text-muted-foreground">
                      Discover high-value keywords for your niche
                    </div>
                  </div>
                </Button>
                <Button
                  variant="outline"
                  className="justify-start h-auto py-3"
                  onClick={() => router.push("/campaigns")}
                >
                  <Rocket className="mr-3 size-4 text-orange-500" />
                  <div className="text-left">
                    <div className="font-medium">Create Campaign</div>
                    <div className="text-xs text-muted-foreground">
                      Plan and execute a keyword push campaign
                    </div>
                  </div>
                </Button>
                <Button
                  variant="outline"
                  className="justify-start h-auto py-3"
                  onClick={() => router.push("/analytics")}
                >
                  <TrendingDown className="mr-3 size-4 text-violet-500" />
                  <div className="text-left">
                    <div className="font-medium">View Analytics</div>
                    <div className="text-xs text-muted-foreground">
                      Deep dive into spend, ROI, and keyword performance
                    </div>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ErrorBoundary>
  );
}
