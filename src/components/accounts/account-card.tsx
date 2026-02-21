'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Users, AppWindow, Calendar } from 'lucide-react';

type AccountStatus = 'ACTIVE' | 'SUSPENDED' | 'EXPIRED' | 'BANNED';

const statusStyle: Record<AccountStatus, string> = {
  ACTIVE: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  SUSPENDED: 'bg-red-500/20 text-red-400 border-red-500/30',
  EXPIRED: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  BANNED: 'bg-zinc-700/40 text-zinc-500 border-zinc-600/30',
};

interface AccountCardProps {
  account: {
    id: string;
    email: string;
    teamName?: string | null;
    status: AccountStatus;
    maxApps: number;
    expiresAt?: string | null;
    tags: string[];
    _count?: { apps: number };
  };
}

export function AccountCard({ account }: AccountCardProps) {
  const appCount = account._count?.apps ?? 0;

  return (
    <Link href={`/accounts/${account.id}`}>
      <Card className="group cursor-pointer border-border/50 bg-card transition-all hover:border-primary/30 hover:shadow-md">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
              <Users className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="truncate text-sm font-semibold group-hover:text-primary">
                  {account.teamName || account.email}
                </h3>
                <Badge variant="outline" className={cn('border text-[11px]', statusStyle[account.status])}>
                  {account.status}
                </Badge>
              </div>
              {account.teamName && (
                <p className="mt-0.5 truncate text-xs text-muted-foreground">{account.email}</p>
              )}
            </div>
          </div>

          <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <AppWindow className="h-3.5 w-3.5" />
              <span>{appCount} / {account.maxApps} apps</span>
            </div>
            {account.expiresAt && (
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                <span>Exp. {new Date(account.expiresAt).toLocaleDateString()}</span>
              </div>
            )}
          </div>

          {account.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1">
              {account.tags.slice(0, 3).map((tag) => (
                <span key={tag} className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                  {tag}
                </span>
              ))}
              {account.tags.length > 3 && (
                <span className="text-[10px] text-muted-foreground">+{account.tags.length - 3}</span>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
