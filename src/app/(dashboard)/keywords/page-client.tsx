'use client';

import { useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { KeywordTable } from '@/components/keywords/keyword-table';
import { KeywordSearch } from '@/components/keywords/keyword-search';
import { KeyRound, Plus, Upload } from 'lucide-react';

interface Niche {
  id: string;
  name: string;
  displayName: string;
}

interface Props {
  keywords: Array<Record<string, unknown>>;
  niches: Niche[];
  total: number;
  page: number;
  limit: number;
  search: string;
  nicheId: string;
  intent: string;
  minTraffic?: number;
  maxTraffic?: number;
  sortBy: string;
  sortOrder: string;
}

export function KeywordsPageClient({
  keywords,
  niches,
  total,
  page,
  limit,
  search: initialSearch,
  nicheId: initialNicheId,
  intent: initialIntent,
  sortBy: initialSortBy,
  sortOrder: initialSortOrder,
}: Props) {
  const router = useRouter();
  const [search, setSearch] = useState(initialSearch);

  const updateParams = useCallback(
    (updates: Record<string, string | undefined>) => {
      const sp = new URLSearchParams(window.location.search);
      for (const [key, value] of Object.entries(updates)) {
        if (value) sp.set(key, value);
        else sp.delete(key);
      }
      router.push(`/keywords?${sp.toString()}`);
    },
    [router],
  );

  const handleSearch = useCallback(
    (value: string) => {
      setSearch(value);
      const timeout = setTimeout(() => {
        updateParams({ search: value || undefined, page: '1' });
      }, 400);
      return () => clearTimeout(timeout);
    },
    [updateParams],
  );

  const handlePageChange = useCallback(
    (p: number) => updateParams({ page: String(p) }),
    [updateParams],
  );

  const handleSort = useCallback(
    (column: string, direction: 'asc' | 'desc') => {
      updateParams({ sortBy: column, sortOrder: direction, page: '1' });
    },
    [updateParams],
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <KeyRound className="size-6" />
            Keywords
          </h1>
          <p className="text-muted-foreground mt-1">
            Explore, check, and manage keywords for your ASO strategy.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Upload className="size-4 mr-1" />
            Import
          </Button>
          <Button size="sm">
            <Plus className="size-4 mr-1" />
            Add Keyword
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="flex-1">
          <KeywordSearch
            value={search}
            onChange={handleSearch}
            onCheck={() => router.refresh()}
          />
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={initialNicheId || 'all'}
            onValueChange={(v) => updateParams({ nicheId: v === 'all' ? undefined : v, page: '1' })}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Niches" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Niches</SelectItem>
              {niches.map((n) => (
                <SelectItem key={n.id} value={n.id}>{n.displayName}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={initialIntent || 'all'}
            onValueChange={(v) => updateParams({ intent: v === 'all' ? undefined : v, page: '1' })}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="All Intents" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Intents</SelectItem>
              <SelectItem value="NAVIGATIONAL">Navigational</SelectItem>
              <SelectItem value="INFORMATIONAL">Informational</SelectItem>
              <SelectItem value="TRANSACTIONAL">Transactional</SelectItem>
              <SelectItem value="MIXED">Mixed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <KeywordTable
        data={keywords as never[]}
        total={total}
        page={page}
        limit={limit}
        onPageChange={handlePageChange}
        onSort={handleSort}
      />
    </div>
  );
}
