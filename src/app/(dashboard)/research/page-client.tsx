'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { DataTable, ColumnDef } from '@/components/shared/data-table';
import { StatusBadge } from '@/components/shared/status-badge';
import { EmptyState } from '@/components/shared/empty-state';
import { Badge } from '@/components/ui/badge';
import { Search, Plus } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ResearchSession {
  id: string;
  name: string;
  status: string;
  seedKeywords: string[];
  targetCountry: string;
  targetLocale: string;
  foundKeywords: number;
  processedSeeds: number;
  totalSeeds: number;
  maxKeywords: number;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  niche?: { id: string; displayName: string } | null;
  _count?: { keywords: number };
}

interface Props {
  sessions: ResearchSession[];
  total: number;
  page: number;
  limit: number;
}

const columns: ColumnDef<ResearchSession>[] = [
  {
    id: 'name',
    header: 'Name',
    accessorKey: 'name',
    sortable: true,
    cell: (row) => (
      <Link href={`/research/${row.id}`} className="font-medium text-primary hover:underline">
        {row.name}
      </Link>
    ),
  },
  {
    id: 'status',
    header: 'Status',
    cell: (row) => <StatusBadge status={row.status} />,
  },
  {
    id: 'seeds',
    header: 'Seeds',
    cell: (row) => (
      <span className="tabular-nums">{row.seedKeywords.length}</span>
    ),
  },
  {
    id: 'found',
    header: 'Found',
    cell: (row) => (
      <span className="tabular-nums font-medium">{row.foundKeywords}</span>
    ),
  },
  {
    id: 'progress',
    header: 'Progress',
    cell: (row) => {
      const pct = row.totalSeeds > 0
        ? Math.round((row.processedSeeds / row.totalSeeds) * 100)
        : 0;
      return (
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-16 rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
          </div>
          <span className="text-xs tabular-nums text-muted-foreground">{pct}%</span>
        </div>
      );
    },
  },
  {
    id: 'country',
    header: 'Country',
    cell: (row) => (
      <Badge variant="outline" className="text-[10px]">
        {row.targetCountry}
      </Badge>
    ),
  },
  {
    id: 'started',
    header: 'Started',
    cell: (row) =>
      row.startedAt ? (
        <span className="text-sm text-muted-foreground">
          {formatDistanceToNow(new Date(row.startedAt), { addSuffix: true })}
        </span>
      ) : (
        <span className="text-muted-foreground">—</span>
      ),
  },
];

export function ResearchPageClient({ sessions, total, page, limit }: Props) {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Search className="size-6" />
            Keyword Research
          </h1>
          <p className="text-muted-foreground mt-1">
            Run automated keyword discovery research sessions.
          </p>
        </div>
        <Link href="/research/new">
          <Button size="sm">
            <Plus className="size-4 mr-1" />
            Start Research
          </Button>
        </Link>
      </div>

      {sessions.length > 0 ? (
        <DataTable
          columns={columns as unknown as ColumnDef<Record<string, unknown>>[]}
          data={sessions as unknown as Record<string, unknown>[]}
          total={total}
          page={page}
          limit={limit}
          onPageChange={(p) => router.push(`/research?page=${p}`)}
          emptyMessage="No research sessions found."
        />
      ) : (
        <EmptyState
          icon={Search}
          title="No research sessions"
          description="Start your first keyword research to discover new keywords automatically."
          action={{ label: 'Start Research', onClick: () => router.push('/research/new') }}
        />
      )}
    </div>
  );
}
