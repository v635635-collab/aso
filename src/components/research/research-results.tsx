'use client';

import Link from 'next/link';
import { DataTable, ColumnDef } from '@/components/shared/data-table';
import { TrafficBadge } from '@/components/keywords/traffic-badge';

interface ResearchKeywordRow {
  id: string;
  discoveryMethod: string;
  depth: number;
  keyword: {
    id: string;
    text: string;
    trafficScore: number | null;
    sap: number | null;
    competition: number | null;
    difficulty: number | null;
  };
}

interface ResearchResultsProps {
  keywords: ResearchKeywordRow[];
  className?: string;
}

const columns: ColumnDef<ResearchKeywordRow>[] = [
  {
    id: 'keyword',
    header: 'Keyword',
    cell: (row) => (
      <Link
        href={`/keywords/${row.keyword.id}`}
        className="font-medium text-primary hover:underline"
      >
        {row.keyword.text}
      </Link>
    ),
  },
  {
    id: 'traffic',
    header: 'Traffic',
    sortable: true,
    cell: (row) => <TrafficBadge score={row.keyword.trafficScore} />,
  },
  {
    id: 'sap',
    header: 'SAP',
    cell: (row) => (
      <span className="tabular-nums">{row.keyword.sap?.toFixed(1) ?? '—'}</span>
    ),
  },
  {
    id: 'competition',
    header: 'Competition',
    cell: (row) => (
      <span className="tabular-nums">{row.keyword.competition?.toFixed(1) ?? '—'}</span>
    ),
  },
  {
    id: 'depth',
    header: 'Depth',
    cell: (row) => (
      <span className="tabular-nums text-muted-foreground">{row.depth}</span>
    ),
  },
  {
    id: 'method',
    header: 'Method',
    cell: (row) => (
      <span className="text-sm text-muted-foreground capitalize">
        {row.discoveryMethod.replace(/_/g, ' ')}
      </span>
    ),
  },
];

export function ResearchResults({ keywords, className }: ResearchResultsProps) {
  return (
    <div className={className}>
      <DataTable
        columns={columns as unknown as ColumnDef<Record<string, unknown>>[]}
        data={keywords as unknown as Record<string, unknown>[]}
        emptyMessage="No keywords discovered yet."
      />
    </div>
  );
}
