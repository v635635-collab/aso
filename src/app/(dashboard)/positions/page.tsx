"use client";

import * as React from "react";
import { Crosshair, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DateRangePicker } from "@/components/shared/date-range-picker";
import { DataTable, type ColumnDef } from "@/components/shared/data-table";
import { PositionChangeBadge } from "@/components/positions/position-change-badge";
import { PositionChart } from "@/components/positions/position-chart";
import { PositionHeatmap } from "@/components/positions/position-heatmap";
import { useApi } from "@/hooks/use-api";

type PositionRow = {
  [key: string]: unknown;
  id: string;
  position: number | null;
  previousPosition: number | null;
  change: number | null;
  country: string;
  capturedAt: string;
  app: { id: string; name: string; iconUrl: string | null };
  keyword: { id: string; text: string; trafficScore: number | null };
};

interface AppOption {
  id: string;
  name: string;
}

interface TrendPoint {
  date: string;
  position: number | null;
}

interface TrendsData {
  trends: Array<{
    keyword: string;
    keywordId: string;
    points: TrendPoint[];
  }>;
  summary: Array<{
    keyword: string;
    keywordId: string;
    avgPosition: number | null;
    latestPosition: number | null;
    change: number | null;
  }>;
}

const columns: ColumnDef<PositionRow>[] = [
  {
    id: "appName",
    header: "App",
    sortable: true,
    cell: (row) => (
      <div className="flex items-center gap-2">
        {row.app.iconUrl ? (
          <img
            src={row.app.iconUrl}
            alt=""
            className="size-6 rounded"
          />
        ) : (
          <div className="size-6 rounded bg-muted flex items-center justify-center text-[10px] font-medium">
            {row.app.name.charAt(0)}
          </div>
        )}
        <span className="font-medium truncate max-w-[160px]">{row.app.name}</span>
      </div>
    ),
  },
  {
    id: "keyword",
    header: "Keyword",
    sortable: true,
    cell: (row) => <span className="font-medium">{row.keyword.text}</span>,
  },
  {
    id: "position",
    header: "Position",
    sortable: true,
    className: "text-right",
    cell: (row) => (
      <span className="font-mono tabular-nums font-medium">
        {row.position != null ? `#${row.position}` : "—"}
      </span>
    ),
  },
  {
    id: "previousPosition",
    header: "Previous",
    className: "text-right",
    cell: (row) => (
      <span className="font-mono tabular-nums text-muted-foreground">
        {row.previousPosition != null ? `#${row.previousPosition}` : "—"}
      </span>
    ),
  },
  {
    id: "change",
    header: "Change",
    sortable: true,
    className: "text-center",
    cell: (row) => <PositionChangeBadge change={row.change} size="sm" />,
  },
  {
    id: "country",
    header: "Country",
    accessorKey: "country",
    className: "w-20",
  },
  {
    id: "capturedAt",
    header: "Last Checked",
    sortable: true,
    cell: (row) => (
      <span className="text-muted-foreground text-xs">
        {new Date(row.capturedAt).toLocaleString()}
      </span>
    ),
  },
];

export default function PositionsPage() {
  const [page, setPage] = React.useState(1);
  const [selectedAppId, setSelectedAppId] = React.useState("");
  const [dateRange, setDateRange] = React.useState<{ from?: Date; to?: Date }>({});
  const limit = 20;

  const { data: apps } = useApi<AppOption[]>("/api/apps?limit=100");

  const positionsParams = React.useMemo(() => {
    const p = new URLSearchParams();
    p.set("page", String(page));
    p.set("limit", String(limit));
    if (selectedAppId) p.set("appId", selectedAppId);
    if (dateRange.from) p.set("from", dateRange.from.toISOString());
    if (dateRange.to) p.set("to", dateRange.to.toISOString());
    return p.toString();
  }, [page, selectedAppId, dateRange]);

  const {
    data: positions,
    loading: positionsLoading,
  } = useApi<PositionRow[]>(`/api/positions?${positionsParams}`);

  const {
    data: trendsData,
  } = useApi<TrendsData>(
    selectedAppId ? `/api/positions/trends?appId=${selectedAppId}&days=30` : null
  );

  const positionList = positions ?? [];
  const appList = apps ?? [];

  const heatmapData = React.useMemo(() => {
    if (!trendsData?.trends) return [];
    return trendsData.trends.map((t) => ({
      keyword: t.keyword,
      positions: t.points,
    }));
  }, [trendsData]);

  const chartData = React.useMemo(() => {
    if (!trendsData?.trends?.length) return [];
    const allPoints = trendsData.trends.flatMap((t) => t.points);
    const byDate = new Map<string, number[]>();
    for (const p of allPoints) {
      if (p.position == null) continue;
      const existing = byDate.get(p.date) ?? [];
      existing.push(p.position);
      byDate.set(p.date, existing);
    }
    return Array.from(byDate.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, positions]) => ({
        date,
        position: Math.round(positions.reduce((s, v) => s + v, 0) / positions.length),
      }));
  }, [trendsData]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Positions</h1>
          <p className="text-sm text-muted-foreground">
            Cross-app keyword position overview and tracking
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Crosshair className="size-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {positionList.length} snapshots
          </span>
        </div>
      </div>

      {selectedAppId && chartData.length > 0 && (
        <PositionChart data={chartData} title="Average Position (All Keywords)" />
      )}

      {selectedAppId && heatmapData.length > 0 && (
        <PositionHeatmap data={heatmapData} />
      )}

      <DataTable
        columns={columns}
        data={positionList}
        total={positionList.length}
        page={page}
        limit={limit}
        loading={positionsLoading}
        onPageChange={setPage}
        emptyMessage="No position data found. Position snapshots appear after monitoring begins."
        toolbar={
          <div className="flex flex-wrap items-center gap-2">
            <Filter className="size-4 text-muted-foreground" />
            <Select
              value={selectedAppId}
              onValueChange={(v) => {
                setSelectedAppId(v === "__all__" ? "" : v);
                setPage(1);
              }}
            >
              <SelectTrigger size="sm" className="w-[200px]">
                <SelectValue placeholder="All Apps" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All Apps</SelectItem>
                {appList.map((app) => (
                  <SelectItem key={app.id} value={app.id}>
                    {app.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <DateRangePicker
              from={dateRange.from}
              to={dateRange.to}
              onChange={(r) => { setDateRange(r); setPage(1); }}
              className="h-8 text-xs"
            />
          </div>
        }
      />
    </div>
  );
}
