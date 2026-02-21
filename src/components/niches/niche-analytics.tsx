'use client';

import { MetricCard } from '@/components/shared/metric-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { KeyRound, TrendingUp, Shield, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NicheAnalyticsProps {
  data: {
    totalKeywords: number;
    totalTraffic: number;
    avgSap: number;
    avgCompetition: number;
    avgDifficulty: number;
    intentDistribution: Record<string, number>;
    trafficDistribution: { low: number; medium: number; high: number };
  } | null;
  loading?: boolean;
}

export function NicheAnalytics({ data, loading }: NicheAnalyticsProps) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Keywords"
          value={data?.totalKeywords ?? 0}
          icon={KeyRound}
          loading={loading}
        />
        <MetricCard
          title="Total Traffic"
          value={data?.totalTraffic?.toLocaleString() ?? '0'}
          icon={TrendingUp}
          loading={loading}
        />
        <MetricCard
          title="Avg SAP"
          value={data?.avgSap?.toFixed(1) ?? '0'}
          icon={Shield}
          loading={loading}
        />
        <MetricCard
          title="Avg Difficulty"
          value={data?.avgDifficulty?.toFixed(0) ?? '0'}
          icon={BarChart3}
          loading={loading}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Traffic Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {data ? (
              <div className="space-y-3">
                <TrafficBar label="High (>50)" count={data.trafficDistribution.high} total={data.totalKeywords} color="bg-emerald-500" />
                <TrafficBar label="Medium (20-50)" count={data.trafficDistribution.medium} total={data.totalKeywords} color="bg-amber-500" />
                <TrafficBar label="Low (<20)" count={data.trafficDistribution.low} total={data.totalKeywords} color="bg-zinc-400" />
              </div>
            ) : (
              <div className="h-24 flex items-center justify-center text-muted-foreground text-sm">
                No data available
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Intent Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {data && Object.keys(data.intentDistribution).length > 0 ? (
              <div className="space-y-3">
                {Object.entries(data.intentDistribution).map(([intent, count]) => (
                  <TrafficBar
                    key={intent}
                    label={intent.charAt(0) + intent.slice(1).toLowerCase()}
                    count={count}
                    total={data.totalKeywords}
                    color="bg-primary"
                  />
                ))}
              </div>
            ) : (
              <div className="h-24 flex items-center justify-center text-muted-foreground text-sm">
                No intent data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function TrafficBar({
  label,
  count,
  total,
  color,
}: {
  label: string;
  count: number;
  total: number;
  color: string;
}) {
  const pct = total > 0 ? (count / total) * 100 : 0;

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{count}</span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div className={cn('h-full rounded-full transition-all', color)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
