'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { AppCard } from '@/components/apps/app-card';
import { AppList } from '@/components/apps/app-list';
import { AppForm } from '@/components/apps/app-form';
import { Plus, Search, LayoutGrid, List, AppWindow } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Account {
  id: string;
  email: string;
  teamName?: string | null;
}

interface App {
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

interface Props {
  apps: App[];
  accounts: Account[];
  total: number;
  page: number;
  limit: number;
  search: string;
  status: string;
  accountId: string;
  view: string;
}

export function AppsPageClient({ apps, accounts, total, page, limit, search, status, accountId, view }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formOpen, setFormOpen] = useState(false);

  const totalPages = Math.ceil(total / limit);

  const updateParams = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    if (key !== 'page') params.delete('page');
    router.push(`/apps?${params.toString()}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Applications</h1>
          <p className="mt-1 text-sm text-muted-foreground">{total} app{total !== 1 ? 's' : ''} total</p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add App
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search apps..."
            defaultValue={search}
            className="pl-9"
            onChange={(e) => {
              const timeout = setTimeout(() => updateParams('search', e.target.value), 400);
              return () => clearTimeout(timeout);
            }}
          />
        </div>
        <Select value={status || 'all'} onValueChange={(v) => updateParams('status', v === 'all' ? '' : v)}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="All statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="DRAFT">Draft</SelectItem>
            <SelectItem value="IN_REVIEW">In Review</SelectItem>
            <SelectItem value="LIVE">Live</SelectItem>
            <SelectItem value="SUSPENDED">Suspended</SelectItem>
            <SelectItem value="REMOVED">Removed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={accountId || 'all'} onValueChange={(v) => updateParams('accountId', v === 'all' ? '' : v)}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="All accounts" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All accounts</SelectItem>
            {accounts.map((a) => (
              <SelectItem key={a.id} value={a.id}>{a.teamName || a.email}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="ml-auto flex items-center rounded-lg border border-border/60 p-0.5">
          <Button
            variant="ghost"
            size="icon"
            className={cn('h-8 w-8', view === 'grid' && 'bg-accent')}
            onClick={() => updateParams('view', 'grid')}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={cn('h-8 w-8', view === 'list' && 'bg-accent')}
            onClick={() => updateParams('view', 'list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {apps.length > 0 ? (
        view === 'grid' ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {apps.map((app) => (
              <AppCard key={app.id} app={app} />
            ))}
          </div>
        ) : (
          <AppList apps={apps} />
        )
      ) : (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border/60 py-16">
          <AppWindow className="mb-3 h-10 w-10 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">No applications found</p>
          <p className="mt-1 text-xs text-muted-foreground/70">
            {search || status || accountId ? 'Try adjusting your filters' : 'Add your first app to get started'}
          </p>
          {!search && !status && !accountId && (
            <Button variant="outline" size="sm" className="mt-4" onClick={() => setFormOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Add App
            </Button>
          )}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => updateParams('page', String(page - 1))}>
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => updateParams('page', String(page + 1))}>
            Next
          </Button>
        </div>
      )}

      <AppForm open={formOpen} onOpenChange={setFormOpen} accounts={accounts} />
    </div>
  );
}
