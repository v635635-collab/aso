'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { AccountCard } from '@/components/accounts/account-card';
import { AccountForm } from '@/components/accounts/account-form';
import { Plus, Search, Users } from 'lucide-react';

interface Account {
  id: string;
  email: string;
  teamName?: string | null;
  status: 'ACTIVE' | 'SUSPENDED' | 'EXPIRED' | 'BANNED';
  maxApps: number;
  expiresAt?: string | null;
  tags: string[];
  _count?: { apps: number };
}

interface Props {
  accounts: Account[];
  total: number;
  page: number;
  limit: number;
  search: string;
  status: string;
}

export function AccountsPageClient({ accounts, total, page, limit, search, status }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formOpen, setFormOpen] = useState(false);

  const totalPages = Math.ceil(total / limit);

  const updateParams = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    if (key !== 'page') params.delete('page');
    router.push(`/accounts?${params.toString()}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Apple Developer Accounts</h1>
          <p className="mt-1 text-sm text-muted-foreground">{total} account{total !== 1 ? 's' : ''} total</p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add Account
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search accounts..."
            defaultValue={search}
            className="pl-9"
            onChange={(e) => {
              const timeout = setTimeout(() => updateParams('search', e.target.value), 400);
              return () => clearTimeout(timeout);
            }}
          />
        </div>
        <Select value={status || 'all'} onValueChange={(v) => updateParams('status', v === 'all' ? '' : v)}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="All statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="SUSPENDED">Suspended</SelectItem>
            <SelectItem value="EXPIRED">Expired</SelectItem>
            <SelectItem value="BANNED">Banned</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {accounts.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {accounts.map((account) => (
            <AccountCard key={account.id} account={account} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border/60 py-16">
          <Users className="mb-3 h-10 w-10 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">No accounts found</p>
          <p className="mt-1 text-xs text-muted-foreground/70">
            {search || status ? 'Try adjusting your filters' : 'Add your first Apple Developer account'}
          </p>
          {!search && !status && (
            <Button variant="outline" size="sm" className="mt-4" onClick={() => setFormOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Add Account
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

      <AccountForm open={formOpen} onOpenChange={setFormOpen} />
    </div>
  );
}
