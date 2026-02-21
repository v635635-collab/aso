'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MetricCard } from '@/components/shared/metric-card';
import { StatusBadge } from '@/components/shared/status-badge';
import { KeywordMetrics } from '@/components/keywords/keyword-metrics';
import { TrafficBadge } from '@/components/keywords/traffic-badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useApi } from '@/hooks/use-api';
import {
  ArrowLeft, TrendingUp, Shield, BarChart3, Globe, AppWindow, Sparkles,
} from 'lucide-react';

interface KeywordDetail {
  id: string;
  text: string;
  normalizedText: string;
  locale: string;
  country: string;
  trafficScore: number | null;
  sap: number | null;
  competition: number | null;
  difficulty: number | null;
  totalApps: number | null;
  intent: string | null;
  tags: string[];
  notes: string | null;
  lastCheckedAt: string | null;
  niche: { id: string; name: string; displayName: string } | null;
  metrics: Array<{
    id: string;
    trafficScore: number | null;
    sap: number | null;
    competition: number | null;
    capturedAt: string;
  }>;
  appKeywords: Array<{
    id: string;
    currentPosition: number | null;
    app: { id: string; name: string; iconUrl: string | null; status: string };
  }>;
  suggestions: Array<{
    id: string;
    suggestedKeyword: {
      id: string;
      text: string;
      trafficScore: number | null;
      sap: number | null;
      competition: number | null;
    };
  }>;
  _count: { worldwideChecks: number; researchKeywords: number };
}

interface Props {
  keyword: KeywordDetail;
}

export function KeywordDetailClient({ keyword }: Props) {
  const { data: worldwideData } = useApi<{
    keyword: { id: string; text: string };
    countries: Array<{ country: string; trafficScore: number | null; sap: number | null }>;
  }>(keyword._count.worldwideChecks > 0 ? `/api/keywords/${keyword.id}/worldwide` : null);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/keywords">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="size-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">{keyword.text}</h1>
          <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
            <span>{keyword.country} / {keyword.locale}</span>
            {keyword.niche && (
              <>
                <span>&middot;</span>
                <Link href={`/niches/${keyword.niche.id}`} className="text-primary hover:underline">
                  {keyword.niche.displayName}
                </Link>
              </>
            )}
            {keyword.intent && (
              <>
                <span>&middot;</span>
                <StatusBadge status={keyword.intent} size="sm" />
              </>
            )}
          </div>
        </div>
        <KeywordMetrics
          trafficScore={keyword.trafficScore}
          sap={keyword.sap}
          competition={keyword.competition}
          difficulty={keyword.difficulty}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Traffic Score" value={keyword.trafficScore ?? 0} icon={TrendingUp} />
        <MetricCard title="SAP" value={keyword.sap?.toFixed(1) ?? '0'} icon={Shield} />
        <MetricCard title="Competition" value={keyword.competition?.toFixed(1) ?? '0'} icon={BarChart3} />
        <MetricCard title="Total Apps" value={keyword.totalApps ?? 0} icon={AppWindow} />
      </div>

      <Tabs defaultValue="metrics">
        <TabsList>
          <TabsTrigger value="metrics">Metrics History</TabsTrigger>
          <TabsTrigger value="apps">Linked Apps ({keyword.appKeywords.length})</TabsTrigger>
          <TabsTrigger value="suggestions">Suggestions ({keyword.suggestions.length})</TabsTrigger>
          <TabsTrigger value="worldwide">Worldwide ({keyword._count.worldwideChecks})</TabsTrigger>
        </TabsList>

        <TabsContent value="metrics" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Metrics History</CardTitle>
            </CardHeader>
            <CardContent>
              {keyword.metrics.length > 0 ? (
                <div className="space-y-2">
                  {keyword.metrics.map((m) => (
                    <div key={m.id} className="flex items-center justify-between text-sm border-b pb-2 last:border-0">
                      <span className="text-muted-foreground">
                        {new Date(m.capturedAt).toLocaleDateString()}
                      </span>
                      <div className="flex items-center gap-4">
                        <span>Traffic: <strong>{m.trafficScore ?? '—'}</strong></span>
                        <span>SAP: <strong>{m.sap?.toFixed(1) ?? '—'}</strong></span>
                        <span>Comp: <strong>{m.competition?.toFixed(1) ?? '—'}</strong></span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">No metrics history yet.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="apps" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              {keyword.appKeywords.length > 0 ? (
                <div className="space-y-3">
                  {keyword.appKeywords.map((ak) => (
                    <div key={ak.id} className="flex items-center justify-between">
                      <Link
                        href={`/apps/${ak.app.id}`}
                        className="flex items-center gap-2 hover:underline"
                      >
                        {ak.app.iconUrl && (
                          <img src={ak.app.iconUrl} alt="" className="size-8 rounded-lg" />
                        )}
                        <span className="font-medium">{ak.app.name}</span>
                        <StatusBadge status={ak.app.status} size="sm" />
                      </Link>
                      <span className="text-sm tabular-nums text-muted-foreground">
                        Pos: {ak.currentPosition ?? '—'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">No apps tracking this keyword.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="suggestions" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              {keyword.suggestions.length > 0 ? (
                <div className="space-y-2">
                  {keyword.suggestions.map((s) => (
                    <div key={s.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                      <Link
                        href={`/keywords/${s.suggestedKeyword.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {s.suggestedKeyword.text}
                      </Link>
                      <div className="flex items-center gap-3 text-sm">
                        <TrafficBadge score={s.suggestedKeyword.trafficScore} />
                        <span className="tabular-nums">SAP: {s.suggestedKeyword.sap?.toFixed(1) ?? '—'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">No suggestions available.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="worldwide" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Globe className="size-4" />
                Worldwide Check Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              {worldwideData?.countries && worldwideData.countries.length > 0 ? (
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {worldwideData.countries.map((c) => (
                    <div key={c.country} className="flex items-center justify-between rounded-lg border p-3">
                      <span className="font-medium">{c.country}</span>
                      <div className="flex items-center gap-2 text-sm">
                        <TrafficBadge score={c.trafficScore} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">No worldwide data available yet.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
