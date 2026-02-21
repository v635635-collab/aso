'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AppForm } from '@/components/apps/app-form';
import { AppStatusBadge } from '@/components/apps/app-status-badge';
import {
  ArrowLeft, Edit, Trash2, RefreshCw, Download, BarChart3, Star, KeyRound,
  Rocket, LineChart, AppWindow, Users, TrendingUp, TrendingDown, Minus, ExternalLink,
} from 'lucide-react';

interface Account { id: string; email: string; teamName?: string | null }

interface AppDetail {
  id: string;
  appleId: string;
  bundleId: string;
  name: string;
  subtitle?: string | null;
  currentTitle?: string | null;
  currentSubtitle?: string | null;
  type: string;
  category?: string | null;
  storeUrl?: string | null;
  iconUrl?: string | null;
  status: 'DRAFT' | 'IN_REVIEW' | 'LIVE' | 'SUSPENDED' | 'REMOVED';
  locale: string;
  country: string;
  organicDownloads: number;
  categoryRank?: number | null;
  rating?: number | null;
  reviewCount: number;
  lastSyncAt?: string | null;
  accountId: string;
  tags: string[];
  notes?: string | null;
  createdAt: string;
  account?: { id: string; email: string; teamName?: string | null; status: string } | null;
  niche?: { id: string; name: string; displayName: string } | null;
  keywords: Array<{
    id: string;
    currentPosition?: number | null;
    bestPosition?: number | null;
    positionTrend: string;
    isInTitle: boolean;
    isInSubtitle: boolean;
    keyword: { id: string; text: string; trafficScore?: number | null };
  }>;
  pushCampaigns: Array<{
    id: string; name: string; status: string; strategy: string;
    totalInstalls: number; startDate?: string | null; endDate?: string | null;
  }>;
  competitors: Array<{
    id: string;
    sharedKeywords: number;
    overlapScore?: number | null;
    competitor: { id: string; name: string; iconUrl?: string | null; rating?: number | null };
  }>;
  _count: { keywords: number; pushCampaigns: number; positionSnapshots: number; titleVariants: number; competitors: number };
}

const trendIcon = (trend: string) => {
  switch (trend) {
    case 'RISING': return <TrendingUp className="h-3 w-3 text-emerald-400" />;
    case 'FALLING': return <TrendingDown className="h-3 w-3 text-red-400" />;
    default: return <Minus className="h-3 w-3 text-muted-foreground" />;
  }
};

export function AppDetailClient({ app, accounts }: { app: AppDetail; accounts: Account[] }) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const handleDelete = async () => {
    if (!confirm('Delete this app? All related data will be removed.')) return;
    await fetch(`/api/apps/${app.id}`, { method: 'DELETE' });
    router.push('/apps');
    router.refresh();
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      await fetch(`/api/apps/${app.id}/sync`, { method: 'POST' });
      router.refresh();
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/apps"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-muted">
          {app.iconUrl ? (
            <img src={app.iconUrl} alt={app.name} className="h-12 w-12 rounded-xl object-cover" />
          ) : (
            <AppWindow className="h-6 w-6 text-muted-foreground" />
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">{app.name}</h1>
            <AppStatusBadge status={app.status} />
          </div>
          <p className="text-sm text-muted-foreground">
            {app.bundleId}
            {app.account && <> &middot; {app.account.teamName || app.account.email}</>}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleSync} disabled={syncing}>
          <RefreshCw className={`mr-2 h-4 w-4 ${syncing ? 'animate-spin' : ''}`} /> Sync
        </Button>
        <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
          <Edit className="mr-2 h-4 w-4" /> Edit
        </Button>
        <Button variant="outline" size="sm" className="text-red-400 hover:text-red-300" onClick={handleDelete}>
          <Trash2 className="mr-2 h-4 w-4" /> Delete
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/50">
          <CardContent className="flex items-center gap-3 p-4">
            <Download className="h-5 w-5 text-blue-400" />
            <div>
              <p className="text-xs text-muted-foreground">Organic Downloads</p>
              <p className="text-lg font-semibold">{app.organicDownloads.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="flex items-center gap-3 p-4">
            <BarChart3 className="h-5 w-5 text-purple-400" />
            <div>
              <p className="text-xs text-muted-foreground">Category Rank</p>
              <p className="text-lg font-semibold">{app.categoryRank ? `#${app.categoryRank}` : '—'}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="flex items-center gap-3 p-4">
            <Star className="h-5 w-5 text-yellow-400" />
            <div>
              <p className="text-xs text-muted-foreground">Rating</p>
              <p className="text-lg font-semibold">{app.rating?.toFixed(1) ?? '—'} <span className="text-xs text-muted-foreground">({app.reviewCount})</span></p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="flex items-center gap-3 p-4">
            <KeyRound className="h-5 w-5 text-emerald-400" />
            <div>
              <p className="text-xs text-muted-foreground">Keywords</p>
              <p className="text-lg font-semibold">{app._count.keywords}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="keywords">Keywords ({app._count.keywords})</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns ({app._count.pushCampaigns})</TabsTrigger>
          <TabsTrigger value="competitors">Competitors ({app._count.competitors})</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="border-border/50">
              <CardHeader className="pb-3"><CardTitle className="text-sm">App Info</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Apple ID</span><span>{app.appleId}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Bundle ID</span><span>{app.bundleId}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Type</span><span>{app.type}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Category</span><span>{app.category || '—'}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Locale</span><span>{app.locale} / {app.country}</span></div>
                {app.storeUrl && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Store</span>
                    <a href={app.storeUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                      View <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last Sync</span>
                  <span>{app.lastSyncAt ? new Date(app.lastSyncAt).toLocaleString() : 'Never'}</span>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border/50">
              <CardHeader className="pb-3"><CardTitle className="text-sm">Current Title</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground">Title</p>
                  <p className="text-sm font-medium">{app.currentTitle || app.name}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Subtitle</p>
                  <p className="text-sm">{app.currentSubtitle || app.subtitle || '—'}</p>
                </div>
                {app.niche && (
                  <div>
                    <p className="text-xs text-muted-foreground">Niche</p>
                    <p className="text-sm">{app.niche.displayName}</p>
                  </div>
                )}
                {app.tags.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Tags</p>
                    <div className="flex flex-wrap gap-1">
                      {app.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-[11px]">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {app.notes && (
                  <div>
                    <p className="text-xs text-muted-foreground">Notes</p>
                    <p className="text-sm whitespace-pre-wrap">{app.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/apps/${app.id}/keywords`}><KeyRound className="mr-2 h-4 w-4" /> All Keywords</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/apps/${app.id}/positions`}><LineChart className="mr-2 h-4 w-4" /> Position History</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/apps/${app.id}/campaigns`}><Rocket className="mr-2 h-4 w-4" /> All Campaigns</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/apps/${app.id}/titles`}><AppWindow className="mr-2 h-4 w-4" /> Title Variants</Link>
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="keywords" className="mt-4">
          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm">Tracked Keywords</CardTitle>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/apps/${app.id}/keywords`}>View All</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {app.keywords.length > 0 ? (
                <div className="space-y-1">
                  {app.keywords.map((ak) => (
                    <div key={ak.id} className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-accent/30">
                      {trendIcon(ak.positionTrend)}
                      <span className="flex-1 font-medium">{ak.keyword.text}</span>
                      {ak.isInTitle && <Badge variant="secondary" className="text-[10px]">title</Badge>}
                      {ak.isInSubtitle && <Badge variant="secondary" className="text-[10px]">subtitle</Badge>}
                      <span className="text-muted-foreground">{ak.keyword.trafficScore ?? '—'} traffic</span>
                      <span className="w-12 text-right font-mono">
                        {ak.currentPosition != null ? `#${ak.currentPosition}` : '—'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <KeyRound className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">No keywords tracked yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="campaigns" className="mt-4">
          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm">Push Campaigns</CardTitle>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/apps/${app.id}/campaigns`}>View All</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {app.pushCampaigns.length > 0 ? (
                <div className="space-y-2">
                  {app.pushCampaigns.map((c) => (
                    <div key={c.id} className="flex items-center gap-3 rounded-lg border border-border/40 p-3">
                      <Rocket className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{c.name}</p>
                        <p className="text-xs text-muted-foreground">{c.strategy} &middot; {c.totalInstalls} installs</p>
                      </div>
                      <Badge variant="outline" className="text-[11px]">{c.status}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <Rocket className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">No campaigns yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="competitors" className="mt-4">
          <Card className="border-border/50">
            <CardHeader className="pb-3"><CardTitle className="text-sm">Competitors</CardTitle></CardHeader>
            <CardContent>
              {app.competitors.length > 0 ? (
                <div className="space-y-2">
                  {app.competitors.map((cr) => (
                    <div key={cr.id} className="flex items-center gap-3 rounded-lg border border-border/40 p-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                        {cr.competitor.iconUrl ? (
                          <img src={cr.competitor.iconUrl} alt={cr.competitor.name} className="h-8 w-8 rounded-lg object-cover" />
                        ) : (
                          <Users className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{cr.competitor.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {cr.sharedKeywords} shared keywords
                          {cr.overlapScore != null && <> &middot; {(cr.overlapScore * 100).toFixed(0)}% overlap</>}
                        </p>
                      </div>
                      {cr.competitor.rating != null && (
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                          <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                          {cr.competitor.rating.toFixed(1)}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <Users className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">No competitors tracked</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AppForm
        open={editOpen}
        onOpenChange={setEditOpen}
        accounts={accounts}
        mode="edit"
        initialData={{
          id: app.id,
          appleId: app.appleId,
          bundleId: app.bundleId,
          name: app.name,
          subtitle: app.subtitle || undefined,
          currentTitle: app.currentTitle || undefined,
          currentSubtitle: app.currentSubtitle || undefined,
          type: app.type,
          category: app.category || undefined,
          storeUrl: app.storeUrl || undefined,
          iconUrl: app.iconUrl || undefined,
          status: app.status,
          locale: app.locale,
          country: app.country,
          accountId: app.accountId,
          tags: app.tags,
          notes: app.notes || undefined,
        }}
      />
    </div>
  );
}
