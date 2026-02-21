'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AccountForm } from '@/components/accounts/account-form';
import { AppStatusBadge } from '@/components/apps/app-status-badge';
import { cn } from '@/lib/utils';
import {
  ArrowLeft, Edit, Trash2, AppWindow, Mail, Hash, Calendar, Shield,
} from 'lucide-react';

type AccountStatus = 'ACTIVE' | 'SUSPENDED' | 'EXPIRED' | 'BANNED';

const statusStyle: Record<AccountStatus, string> = {
  ACTIVE: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  SUSPENDED: 'bg-red-500/20 text-red-400 border-red-500/30',
  EXPIRED: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  BANNED: 'bg-zinc-700/40 text-zinc-500 border-zinc-600/30',
};

interface Account {
  id: string;
  email: string;
  teamName?: string | null;
  teamId?: string | null;
  status: AccountStatus;
  maxApps: number;
  expiresAt?: string | null;
  tags: string[];
  notes?: string | null;
  createdAt: string;
  apps: Array<{
    id: string;
    name: string;
    bundleId: string;
    status: 'DRAFT' | 'IN_REVIEW' | 'LIVE' | 'SUSPENDED' | 'REMOVED';
    iconUrl?: string | null;
    organicDownloads: number;
    categoryRank?: number | null;
    rating?: number | null;
  }>;
  _count: { apps: number };
}

export function AccountDetailClient({ account }: { account: Account }) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm('Delete this account? All linked apps will also be deleted.')) return;
    setDeleting(true);
    await fetch(`/api/accounts/${account.id}`, { method: 'DELETE' });
    router.push('/accounts');
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/accounts"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">{account.teamName || account.email}</h1>
            <Badge variant="outline" className={cn('border', statusStyle[account.status])}>
              {account.status}
            </Badge>
          </div>
          {account.teamName && (
            <p className="mt-0.5 text-sm text-muted-foreground">{account.email}</p>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
          <Edit className="mr-2 h-4 w-4" /> Edit
        </Button>
        <Button variant="outline" size="sm" className="text-red-400 hover:text-red-300" onClick={handleDelete} disabled={deleting}>
          <Trash2 className="mr-2 h-4 w-4" /> Delete
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/50">
          <CardContent className="flex items-center gap-3 p-4">
            <Mail className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Email</p>
              <p className="text-sm font-medium">{account.email}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="flex items-center gap-3 p-4">
            <Hash className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Team ID</p>
              <p className="text-sm font-medium">{account.teamId || '—'}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="flex items-center gap-3 p-4">
            <Shield className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Apps</p>
              <p className="text-sm font-medium">{account._count.apps} / {account.maxApps}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="flex items-center gap-3 p-4">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Expires</p>
              <p className="text-sm font-medium">
                {account.expiresAt ? new Date(account.expiresAt).toLocaleDateString() : 'No expiry'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {account.notes && (
        <Card className="border-border/50">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-muted-foreground mb-1">Notes</p>
            <p className="text-sm whitespace-pre-wrap">{account.notes}</p>
          </CardContent>
        </Card>
      )}

      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Linked Apps ({account.apps.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {account.apps.length > 0 ? (
            <div className="space-y-2">
              {account.apps.map((app) => (
                <Link
                  key={app.id}
                  href={`/apps/${app.id}`}
                  className="flex items-center gap-3 rounded-lg border border-border/40 p-3 transition-colors hover:bg-accent/50"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                    {app.iconUrl ? (
                      <img src={app.iconUrl} alt={app.name} className="h-9 w-9 rounded-lg object-cover" />
                    ) : (
                      <AppWindow className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{app.name}</p>
                    <p className="text-xs text-muted-foreground">{app.bundleId}</p>
                  </div>
                  <AppStatusBadge status={app.status} />
                  <div className="text-right text-xs text-muted-foreground">
                    <div>{app.organicDownloads.toLocaleString()} downloads</div>
                    {app.categoryRank && <div>#{app.categoryRank}</div>}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center">
              <AppWindow className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">No apps linked to this account</p>
            </div>
          )}
        </CardContent>
      </Card>

      <AccountForm
        open={editOpen}
        onOpenChange={setEditOpen}
        mode="edit"
        initialData={{
          id: account.id,
          email: account.email,
          teamName: account.teamName || undefined,
          teamId: account.teamId || undefined,
          status: account.status,
          maxApps: account.maxApps,
          expiresAt: account.expiresAt || undefined,
          notes: account.notes || undefined,
        }}
      />
    </div>
  );
}
