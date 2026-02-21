'use client';

import Link from 'next/link';
import { DataTable, ColumnDef } from '@/components/shared/data-table';
import { TrafficBadge } from './traffic-badge';
import { StatusBadge } from '@/components/shared/status-badge';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';

interface KeywordRow {
  id: string;
  text: string;
  trafficScore: number | null;
  sap: number | null;
  competition: number | null;
  difficulty: number | null;
  intent: string | null;
  tags: string[];
  lastCheckedAt: string | null;
  niche?: { id: string; displayName: string } | null;
  _count?: { appKeywords: number; suggestions: number };
}

interface KeywordTableProps {
  data: KeywordRow[];
  total: number;
  page: number;
  limit: number;
  loading?: boolean;
  onPageChange: (page: number) => void;
  onSort: (column: string, direction: 'asc' | 'desc') => void;
}

const columns: ColumnDef<KeywordRow>[] = [
  {
    id: 'text',
    header: 'Keyword',
    accessorKey: 'text',
    sortable: true,
    cell: (row) => (
      <Link
        href={`/keywords/${row.id}`}
        className="font-medium text-primary hover:underline"
      >
        {row.text}
      </Link>
    ),
  },
  {
    id: 'trafficScore',
    header: 'Traffic',
    accessorKey: 'trafficScore',
    sortable: true,
    cell: (row) => <TrafficBadge score={row.trafficScore} />,
  },
  {
    id: 'sap',
    header: 'SAP',
    accessorKey: 'sap',
    sortable: true,
    cell: (row) => (
      <span className="tabular-nums">{row.sap?.toFixed(1) ?? '—'}</span>
    ),
  },
  {
    id: 'competition',
    header: 'Competition',
    accessorKey: 'competition',
    sortable: true,
    cell: (row) => (
      <span className="tabular-nums">{row.competition?.toFixed(1) ?? '—'}</span>
    ),
  },
  {
    id: 'niche',
    header: 'Niche',
    cell: (row) =>
      row.niche ? (
        <Link href={`/niches/${row.niche.id}`} className="hover:underline text-sm">
          {row.niche.displayName}
        </Link>
      ) : (
        <span className="text-muted-foreground text-sm">—</span>
      ),
  },
  {
    id: 'intent',
    header: 'Intent',
    cell: (row) =>
      row.intent ? <StatusBadge status={row.intent} size="sm" /> : <span className="text-muted-foreground">—</span>,
  },
  {
    id: 'tags',
    header: 'Tags',
    cell: (row) =>
      row.tags.length > 0 ? (
        <div className="flex gap-1 flex-wrap">
          {row.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="secondary" className="text-[10px]">
              {tag}
            </Badge>
          ))}
          {row.tags.length > 3 && (
            <Badge variant="secondary" className="text-[10px]">+{row.tags.length - 3}</Badge>
          )}
        </div>
      ) : null,
  },
  {
    id: 'lastCheckedAt',
    header: 'Last Checked',
    accessorKey: 'lastCheckedAt',
    sortable: true,
    cell: (row) =>
      row.lastCheckedAt ? (
        <span className="text-sm text-muted-foreground">
          {formatDistanceToNow(new Date(row.lastCheckedAt), { addSuffix: true })}
        </span>
      ) : (
        <span className="text-muted-foreground">Never</span>
      ),
  },
];

export function KeywordTable({
  data,
  total,
  page,
  limit,
  loading,
  onPageChange,
  onSort,
}: KeywordTableProps) {
  return (
    <DataTable
      columns={columns as unknown as ColumnDef<Record<string, unknown>>[]}
      data={data as unknown as Record<string, unknown>[]}
      total={total}
      page={page}
      limit={limit}
      loading={loading}
      onPageChange={onPageChange}
      onSort={onSort}
      emptyMessage="No keywords found. Try a different search or add some keywords."
    />
  );
}
