"use client";

import { Badge } from "@/components/ui/badge";
import { DataTable, type ColumnDef } from "@/components/shared/data-table";

export type TrendSnapshot = {
  [key: string]: unknown;
  id: string;
  query: string;
  category: string;
  geo: string;
  interestCurrent: number;
  changePercent: number | null;
  isBreakout: boolean;
  capturedAt: string;
};

const columns: ColumnDef<TrendSnapshot>[] = [
  {
    id: "query",
    header: "Query",
    accessorKey: "query",
    sortable: true,
    cell: (row) => <span className="font-medium">{row.query}</span>,
  },
  {
    id: "category",
    header: "Category",
    accessorKey: "category",
    sortable: true,
  },
  {
    id: "geo",
    header: "Geo",
    accessorKey: "geo",
    cell: (row) => row.geo || "Global",
    className: "w-20",
  },
  {
    id: "interestCurrent",
    header: "Interest",
    accessorKey: "interestCurrent",
    sortable: true,
    className: "text-right",
    cell: (row) => (
      <span className="font-mono tabular-nums">{row.interestCurrent}</span>
    ),
  },
  {
    id: "changePercent",
    header: "Change %",
    sortable: true,
    className: "text-right",
    cell: (row) => {
      const val = row.changePercent;
      if (val == null) return <span className="text-muted-foreground">—</span>;
      const positive = val > 0;
      return (
        <span
          className={
            positive
              ? "text-emerald-600 dark:text-emerald-400 font-medium"
              : val < 0
              ? "text-red-600 dark:text-red-400 font-medium"
              : "text-muted-foreground"
          }
        >
          {positive && "+"}
          {val.toFixed(1)}%
        </span>
      );
    },
  },
  {
    id: "isBreakout",
    header: "Breakout",
    className: "w-24 text-center",
    cell: (row) =>
      row.isBreakout ? (
        <Badge className="bg-violet-500/15 text-violet-700 dark:text-violet-400 border-violet-500/25" variant="outline">
          Breakout
        </Badge>
      ) : null,
  },
  {
    id: "capturedAt",
    header: "Captured",
    sortable: true,
    cell: (row) => (
      <span className="text-muted-foreground text-xs">
        {new Date(row.capturedAt).toLocaleDateString()}
      </span>
    ),
  },
];

interface TrendSnapshotTableProps {
  data: TrendSnapshot[];
  total: number;
  page: number;
  limit: number;
  loading?: boolean;
  onPageChange: (page: number) => void;
  onSort?: (column: string, direction: "asc" | "desc") => void;
  toolbar?: React.ReactNode;
}

export function TrendSnapshotTable({
  data,
  total,
  page,
  limit,
  loading,
  onPageChange,
  onSort,
  toolbar,
}: TrendSnapshotTableProps) {
  return (
    <DataTable
      columns={columns}
      data={data}
      total={total}
      page={page}
      limit={limit}
      loading={loading}
      onPageChange={onPageChange}
      onSort={onSort}
      toolbar={toolbar}
      emptyMessage="No trend snapshots found. Click 'Collect Now' to capture trends."
    />
  );
}
