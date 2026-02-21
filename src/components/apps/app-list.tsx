'use client';

import Link from 'next/link';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { AppStatusBadge } from './app-status-badge';
import { AppWindow, Star } from 'lucide-react';

interface AppRow {
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
}

export function AppList({ apps }: { apps: AppRow[] }) {
  if (apps.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border/60 py-16">
        <AppWindow className="mb-3 h-10 w-10 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">No applications found</p>
        <p className="mt-1 text-xs text-muted-foreground/70">Create your first app to get started</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border/60">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-[300px]">App</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Account</TableHead>
            <TableHead>Niche</TableHead>
            <TableHead className="text-right">Downloads</TableHead>
            <TableHead className="text-right">Rank</TableHead>
            <TableHead className="text-right">Rating</TableHead>
            <TableHead className="text-right">Keywords</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {apps.map((app) => (
            <TableRow key={app.id} className="group cursor-pointer">
              <TableCell>
                <Link href={`/apps/${app.id}`} className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                    {app.iconUrl ? (
                      <img src={app.iconUrl} alt={app.name} className="h-9 w-9 rounded-lg object-cover" />
                    ) : (
                      <AppWindow className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium group-hover:text-primary">{app.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{app.bundleId}</p>
                  </div>
                </Link>
              </TableCell>
              <TableCell><AppStatusBadge status={app.status} /></TableCell>
              <TableCell className="text-sm text-muted-foreground">{app.account?.teamName || app.account?.email || '—'}</TableCell>
              <TableCell className="text-sm text-muted-foreground">{app.niche?.displayName || '—'}</TableCell>
              <TableCell className="text-right text-sm">{app.organicDownloads.toLocaleString()}</TableCell>
              <TableCell className="text-right text-sm">{app.categoryRank ? `#${app.categoryRank}` : '—'}</TableCell>
              <TableCell className="text-right text-sm">
                {app.rating != null ? (
                  <span className="inline-flex items-center gap-1">
                    <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                    {app.rating.toFixed(1)}
                  </span>
                ) : '—'}
              </TableCell>
              <TableCell className="text-right text-sm text-muted-foreground">{app._count?.keywords ?? 0}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
