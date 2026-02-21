'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatusBadge } from '@/components/shared/status-badge';
import { KeywordTable } from '@/components/keywords/keyword-table';
import { NicheClusterView } from '@/components/niches/niche-cluster-view';
import { NicheAnalytics } from '@/components/niches/niche-analytics';
import { useApi, useApiMutation } from '@/hooks/use-api';
import { ArrowLeft, Layers, Sparkles, Loader2, AppWindow } from 'lucide-react';

interface NicheDetail {
  id: string;
  name: string;
  displayName: string;
  description: string | null;
  riskLevel: string;
  totalTraffic: number;
  avgSAP: number;
  avgCompetition: number;
  keywordCount: number;
  keywords: Array<Record<string, unknown>>;
  apps: Array<{
    id: string;
    name: string;
    iconUrl: string | null;
    status: string;
    organicDownloads: number;
    categoryRank: number | null;
  }>;
  children: Array<{
    id: string;
    name: string;
    displayName: string;
    keywordCount: number;
    description: string | null;
  }>;
  parent: { id: string; name: string; displayName: string } | null;
  _count: { keywords: number; apps: number; researchSessions: number };
}

interface Props {
  niche: NicheDetail;
}

interface AnalyticsData {
  totalKeywords: number;
  totalTraffic: number;
  avgSap: number;
  avgCompetition: number;
  avgDifficulty: number;
  intentDistribution: Record<string, number>;
  trafficDistribution: { low: number; medium: number; high: number };
}

export function NicheDetailClient({ niche }: Props) {
  const router = useRouter();
  const { data: analytics, loading: analyticsLoading } = useApi<AnalyticsData>(
    `/api/niches/${niche.id}/analytics`,
  );

  const { trigger: triggerCluster, loading: clustering } = useApiMutation<
    void,
    { jobId: string }
  >(`/api/niches/${niche.id}/cluster`);

  const handleCluster = async () => {
    try {
      await triggerCluster();
      router.refresh();
    } catch {
      // handled by hook
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/niches">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="size-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Layers className="size-5 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight">{niche.displayName}</h1>
            <StatusBadge status={niche.riskLevel} size="sm" />
          </div>
          {niche.description && (
            <p className="text-sm text-muted-foreground mt-1">{niche.description}</p>
          )}
          {niche.parent && (
            <p className="text-xs text-muted-foreground mt-1">
              Parent:{' '}
              <Link href={`/niches/${niche.parent.id}`} className="text-primary hover:underline">
                {niche.parent.displayName}
              </Link>
            </p>
          )}
        </div>
        <Button
          variant="secondary"
          onClick={handleCluster}
          disabled={clustering || niche._count.keywords < 3}
        >
          {clustering ? <Loader2 className="size-4 mr-1 animate-spin" /> : <Sparkles className="size-4 mr-1" />}
          Cluster Keywords
        </Button>
      </div>

      <Tabs defaultValue="keywords">
        <TabsList>
          <TabsTrigger value="keywords">Keywords ({niche._count.keywords})</TabsTrigger>
          <TabsTrigger value="apps">Apps ({niche._count.apps})</TabsTrigger>
          <TabsTrigger value="clusters">Sub-niches ({niche.children.length})</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="keywords" className="mt-4">
          <KeywordTable
            data={niche.keywords as never[]}
            total={niche.keywords.length}
            page={1}
            limit={100}
            onPageChange={() => {}}
            onSort={() => {}}
          />
        </TabsContent>

        <TabsContent value="apps" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              {niche.apps.length > 0 ? (
                <div className="space-y-3">
                  {niche.apps.map((app) => (
                    <div key={app.id} className="flex items-center justify-between">
                      <Link
                        href={`/apps/${app.id}`}
                        className="flex items-center gap-3 hover:underline"
                      >
                        {app.iconUrl && (
                          <img src={app.iconUrl} alt="" className="size-8 rounded-lg" />
                        )}
                        <div>
                          <span className="font-medium">{app.name}</span>
                          <StatusBadge status={app.status} size="sm" />
                        </div>
                      </Link>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>Downloads: {app.organicDownloads.toLocaleString()}</span>
                        {app.categoryRank && <span>Rank: #{app.categoryRank}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 py-8">
                  <AppWindow className="size-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">No apps in this niche.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="clusters" className="mt-4">
          <NicheClusterView clusters={niche.children} />
        </TabsContent>

        <TabsContent value="analytics" className="mt-4">
          <NicheAnalytics data={analytics} loading={analyticsLoading} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
