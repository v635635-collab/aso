"use client";

import * as React from "react";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

export interface ColumnDef<T> {
  id: string;
  header: string;
  accessorKey?: keyof T & string;
  cell?: (row: T) => React.ReactNode;
  sortable?: boolean;
  className?: string;
}

interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  total?: number;
  page?: number;
  limit?: number;
  onPageChange?: (page: number) => void;
  onSort?: (column: string, direction: "asc" | "desc") => void;
  onFilter?: (filters: Record<string, string>) => void;
  loading?: boolean;
  emptyMessage?: string;
  toolbar?: React.ReactNode;
  selectable?: boolean;
  onSelectionChange?: (selected: T[]) => void;
  rowKey?: keyof T & string;
}

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  total,
  page = 1,
  limit = 20,
  onPageChange,
  onSort,
  loading = false,
  emptyMessage = "No results found.",
  toolbar,
  selectable = false,
  onSelectionChange,
  rowKey = "id" as keyof T & string,
}: DataTableProps<T>) {
  const [sortColumn, setSortColumn] = React.useState<string | null>(null);
  const [sortDirection, setSortDirection] = React.useState<"asc" | "desc">(
    "asc"
  );
  const [selectedKeys, setSelectedKeys] = React.useState<Set<string>>(
    new Set()
  );

  const totalRows = total ?? data.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / limit));

  const handleSort = (columnId: string) => {
    let newDirection: "asc" | "desc" = "asc";
    if (sortColumn === columnId && sortDirection === "asc") {
      newDirection = "desc";
    }
    setSortColumn(columnId);
    setSortDirection(newDirection);
    onSort?.(columnId, newDirection);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allKeys = new Set(data.map((row) => String(row[rowKey])));
      setSelectedKeys(allKeys);
      onSelectionChange?.(data);
    } else {
      setSelectedKeys(new Set());
      onSelectionChange?.([]);
    }
  };

  const handleSelectRow = (row: T, checked: boolean) => {
    const key = String(row[rowKey]);
    const next = new Set(selectedKeys);
    if (checked) {
      next.add(key);
    } else {
      next.delete(key);
    }
    setSelectedKeys(next);
    onSelectionChange?.(data.filter((r) => next.has(String(r[rowKey]))));
  };

  const allSelected = data.length > 0 && selectedKeys.size === data.length;

  const getCellValue = (row: T, col: ColumnDef<T>): React.ReactNode => {
    if (col.cell) return col.cell(row);
    if (col.accessorKey) return String(row[col.accessorKey] ?? "");
    return null;
  };

  const renderSortIcon = (columnId: string) => {
    if (sortColumn !== columnId) {
      return <ArrowUpDown className="ml-1 size-3.5 text-muted-foreground/50" />;
    }
    return sortDirection === "asc" ? (
      <ArrowUp className="ml-1 size-3.5" />
    ) : (
      <ArrowDown className="ml-1 size-3.5" />
    );
  };

  const pageNumbers = React.useMemo(() => {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, page - Math.floor(maxVisible / 2));
    const end = Math.min(totalPages, start + maxVisible - 1);
    start = Math.max(1, end - maxVisible + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }, [page, totalPages]);

  return (
    <div className="space-y-4">
      {toolbar && <div className="flex items-center gap-2">{toolbar}</div>}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {selectable && (
                <TableHead className="w-10">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={(c) => handleSelectAll(!!c)}
                    aria-label="Select all"
                  />
                </TableHead>
              )}
              {columns.map((col) => (
                <TableHead key={col.id} className={col.className}>
                  {col.sortable ? (
                    <button
                      type="button"
                      className="inline-flex items-center hover:text-foreground transition-colors -ml-2 px-2 py-1 rounded-md hover:bg-muted"
                      onClick={() => handleSort(col.accessorKey ?? col.id)}
                    >
                      {col.header}
                      {renderSortIcon(col.accessorKey ?? col.id)}
                    </button>
                  ) : (
                    col.header
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: Math.min(limit, 5) }).map((_, i) => (
                <TableRow key={i}>
                  {selectable && (
                    <TableCell>
                      <div className="h-4 w-4 rounded bg-muted animate-pulse" />
                    </TableCell>
                  )}
                  {columns.map((col) => (
                    <TableCell key={col.id}>
                      <div className="h-4 w-24 rounded bg-muted animate-pulse" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length + (selectable ? 1 : 0)}
                  className="h-32 text-center text-muted-foreground"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              data.map((row, idx) => {
                const key = String(row[rowKey] ?? idx);
                return (
                  <TableRow
                    key={key}
                    data-state={selectedKeys.has(key) ? "selected" : undefined}
                  >
                    {selectable && (
                      <TableCell>
                        <Checkbox
                          checked={selectedKeys.has(key)}
                          onCheckedChange={(c) => handleSelectRow(row, !!c)}
                          aria-label={`Select row ${idx + 1}`}
                        />
                      </TableCell>
                    )}
                    {columns.map((col) => (
                      <TableCell key={col.id} className={col.className}>
                        {getCellValue(row, col)}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {onPageChange && totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <p className="text-sm text-muted-foreground">
            {loading ? (
              <span className="inline-flex items-center gap-1">
                <Loader2 className="size-3 animate-spin" />
                Loading…
              </span>
            ) : (
              <>
                Showing {(page - 1) * limit + 1}–
                {Math.min(page * limit, totalRows)} of {totalRows}
              </>
            )}
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon-xs"
              onClick={() => onPageChange(1)}
              disabled={page <= 1 || loading}
            >
              <ChevronsLeft />
            </Button>
            <Button
              variant="outline"
              size="icon-xs"
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1 || loading}
            >
              <ChevronLeft />
            </Button>
            {pageNumbers.map((p) => (
              <Button
                key={p}
                variant={p === page ? "default" : "outline"}
                size="xs"
                onClick={() => onPageChange(p)}
                disabled={loading}
                className={cn("min-w-7", p === page && "pointer-events-none")}
              >
                {p}
              </Button>
            ))}
            <Button
              variant="outline"
              size="icon-xs"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages || loading}
            >
              <ChevronRight />
            </Button>
            <Button
              variant="outline"
              size="icon-xs"
              onClick={() => onPageChange(totalPages)}
              disabled={page >= totalPages || loading}
            >
              <ChevronsRight />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
