'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { AppStatusBadge } from './app-status-badge';
import { AppWindow, Download, BarChart3, Star } from 'lucide-react';

interface AppCardProps {
  app: {
    id: string;
    name: string;
    bundleId: string;
    status: 'DRAFT' | 'IN_REVIEW' | 'LIVE' | 'SUSPENDED' | 'REMOVED';
    iconUrl?: string | null;
    organicDownloads: number;
    categoryRank?: number | null;
    rating?: number | null;
    account?: { teamName?: string | null; email: string } | null;
    niche?: { displayName: string } | null;
    _count?: { keywords: number; pushCampaigns: number };
  };
}

export function AppCard({ app }: AppCardProps) {
  return (
    <Link href={`/apps/${app.id}`}>
      <Card className="group cursor-pointer border-border/50 bg-card transition-all hover:border-primary/30 hover:shadow-md">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-muted">
              {app.iconUrl ? (
                <img src={app.iconUrl} alt={app.name} className="h-11 w-11 rounded-xl object-cover" />
              ) : (
                <AppWindow className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="truncate text-sm font-semibold group-hover:text-primary">{app.name}</h3>
                <AppStatusBadge status={app.status} />
              </div>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {app.account?.teamName || app.account?.email || 'No account'}
                {app.niche && <> &middot; {app.niche.displayName}</>}
              </p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Download className="h-3.5 w-3.5" />
              <span>{app.organicDownloads.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <BarChart3 className="h-3.5 w-3.5" />
              <span>{app.categoryRank ? `#${app.categoryRank}` : '—'}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Star className="h-3.5 w-3.5" />
              <span>{app.rating?.toFixed(1) ?? '—'}</span>
            </div>
          </div>

          {app._count && (
            <div className="mt-3 flex gap-3 border-t border-border/50 pt-3 text-[11px] text-muted-foreground">
              <span>{app._count.keywords} keywords</span>
              <span>{app._count.pushCampaigns} campaigns</span>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
