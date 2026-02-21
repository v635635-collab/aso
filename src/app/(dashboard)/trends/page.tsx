"use client";

import * as React from "react";
import { Loader2, Radio, Sparkles, TrendingUp, Zap, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { DateRangePicker } from "@/components/shared/date-range-picker";
import { DataTable, type ColumnDef } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { GapIndicator } from "@/components/trends/gap-indicator";
import { type TrendOpportunity as TrendOpportunityBase } from "@/components/trends/opportunity-card";
import { useApi, useApiMutation } from "@/hooks/use-api";

type TrendOpportunity = TrendOpportunityBase & { [key: string]: unknown };

type TrendSnapshot = {
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

const CATEGORIES = [
  { value: "", label: "All Categories" },
  { value: "games", label: "Games" },
  { value: "utilities", label: "Utilities" },
  { value: "productivity", label: "Productivity" },
  { value: "health", label: "Health & Fitness" },
  { value: "education", label: "Education" },
  { value: "entertainment", label: "Entertainment" },
  { value: "social", label: "Social" },
  { value: "finance", label: "Finance" },
];

const GEOS = [
  { value: "", label: "All Regions" },
  { value: "US", label: "United States" },
  { value: "RU", label: "Russia" },
  { value: "GB", label: "United Kingdom" },
  { value: "DE", label: "Germany" },
  { value: "FR", label: "France" },
  { value: "JP", label: "Japan" },
];

const snapshotColumns: ColumnDef<TrendSnapshot>[] = [
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
    cell: (row) => row.geo || "Global",
    className: "w-20",
  },
  {
    id: "interestCurrent",
    header: "Interest",
    sortable: true,
    className: "text-right",
    cell: (row) => <span className="font-mono tabular-nums">{row.interestCurrent}</span>,
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
        <span className={positive ? "text-emerald-600 dark:text-emerald-400 font-medium" : val < 0 ? "text-red-600 dark:text-red-400 font-medium" : "text-muted-foreground"}>
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

const OPPORTUNITY_STATUSES = [
  { value: "", label: "All Statuses" },
  { value: "NEW", label: "New" },
  { value: "REVIEWING", label: "Reviewing" },
  { value: "ACTIONABLE", label: "Actionable" },
  { value: "ACTED_ON", label: "Acted On" },
  { value: "DISMISSED", label: "Dismissed" },
  { value: "EXPIRED", label: "Expired" },
];

const opportunityColumns: ColumnDef<TrendOpportunity>[] = [
  {
    id: "trendQuery",
    header: "Trend Query",
    sortable: true,
    cell: (row) => (
      <div className="flex items-center gap-2">
        <span className="font-medium">{row.trendQuery}</span>
        {row.isBreakout && (
          <Badge className="bg-violet-500/15 text-violet-700 dark:text-violet-400 border-violet-500/25 text-[10px]" variant="outline">
            <TrendingUp className="mr-0.5 size-2.5" />
            Breakout
          </Badge>
        )}
      </div>
    ),
  },
  {
    id: "trendCategory",
    header: "Category",
    accessorKey: "trendCategory",
    sortable: true,
  },
  {
    id: "suggestedNiche",
    header: "Suggested Niche",
    cell: (row) =>
      row.suggestedNiche ? (
        <Badge variant="secondary" className="text-xs">{row.suggestedNiche}</Badge>
      ) : (
        <span className="text-muted-foreground">—</span>
      ),
  },
  {
    id: "appStoreGap",
    header: "App Store Gap",
    cell: (row) => <GapIndicator value={row.appStoreGap} showLabel={false} />,
  },
  {
    id: "confidenceScore",
    header: "Confidence",
    sortable: true,
    className: "text-right",
    cell: (row) => (
      <span className="font-mono tabular-nums">
        {row.confidenceScore != null ? `${(row.confidenceScore * 100).toFixed(0)}%` : "—"}
      </span>
    ),
  },
  {
    id: "status",
    header: "Status",
    cell: (row) => <StatusBadge status={row.status} size="sm" />,
  },
  {
    id: "actions",
    header: "",
    className: "w-10",
    cell: (row) => (
      <Button variant="ghost" size="sm" className="h-7 px-2" asChild>
        <a href={`/trends/opportunities/${row.id}`}>View</a>
      </Button>
    ),
  },
];

export default function TrendsPage() {
  const [tab, setTab] = React.useState("snapshots");

  const [snapshotPage, setSnapshotPage] = React.useState(1);
  const [snapshotCategory, setSnapshotCategory] = React.useState("");
  const [snapshotGeo, setSnapshotGeo] = React.useState("");
  const [snapshotBreakout, setSnapshotBreakout] = React.useState(false);
  const [snapshotDateRange, setSnapshotDateRange] = React.useState<{ from?: Date; to?: Date }>({});

  const [oppPage, setOppPage] = React.useState(1);
  const [oppStatus, setOppStatus] = React.useState("");
  const [oppCategory, setOppCategory] = React.useState("");

  const limit = 20;

  const snapshotParams = React.useMemo(() => {
    const p = new URLSearchParams();
    p.set("page", String(snapshotPage));
    p.set("limit", String(limit));
    if (snapshotCategory) p.set("category", snapshotCategory);
    if (snapshotGeo) p.set("geo", snapshotGeo);
    if (snapshotBreakout) p.set("isBreakout", "true");
    if (snapshotDateRange.from) p.set("from", snapshotDateRange.from.toISOString());
    if (snapshotDateRange.to) p.set("to", snapshotDateRange.to.toISOString());
    return p.toString();
  }, [snapshotPage, snapshotCategory, snapshotGeo, snapshotBreakout, snapshotDateRange]);

  const oppParams = React.useMemo(() => {
    const p = new URLSearchParams();
    p.set("page", String(oppPage));
    p.set("limit", String(limit));
    if (oppStatus) p.set("status", oppStatus);
    if (oppCategory) p.set("category", oppCategory);
    return p.toString();
  }, [oppPage, oppStatus, oppCategory]);

  const {
    data: snapshotsRaw,
    loading: snapshotsLoading,
    mutate: refreshSnapshots,
  } = useApi<TrendSnapshot[]>(tab === "snapshots" ? `/api/trends?${snapshotParams}` : null);

  const {
    data: snapshotsMeta,
  } = useApi<{ total: number }>(tab === "snapshots" ? `/api/trends?${snapshotParams}` : null);

  const {
    data: oppsRaw,
    loading: oppsLoading,
    mutate: refreshOpps,
  } = useApi<TrendOpportunity[]>(tab === "opportunities" ? `/api/trends/opportunities?${oppParams}` : null);

  const snapshots = snapshotsRaw ?? [];
  const opportunities = oppsRaw ?? [];

  const { trigger: triggerCollect, loading: collectLoading } = useApiMutation("/api/trends/collect");
  const { trigger: triggerAnalyze, loading: analyzeLoading } = useApiMutation("/api/trends/analyze");

  const handleCollect = async () => {
    await triggerCollect();
    refreshSnapshots();
  };

  const handleAnalyze = async () => {
    await triggerAnalyze();
    refreshOpps();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Google Trends</h1>
          <p className="text-sm text-muted-foreground">
            Monitor trending queries and discover ASO opportunities
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCollect}
            disabled={collectLoading}
          >
            {collectLoading ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Radio className="mr-2 size-4" />}
            Collect Now
          </Button>
          <Button
            size="sm"
            onClick={handleAnalyze}
            disabled={analyzeLoading}
          >
            {analyzeLoading ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Zap className="mr-2 size-4" />}
            Analyze Now
          </Button>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="snapshots">
            <TrendingUp className="mr-1.5 size-3.5" />
            Snapshots
          </TabsTrigger>
          <TabsTrigger value="opportunities">
            <Sparkles className="mr-1.5 size-3.5" />
            Opportunities
          </TabsTrigger>
        </TabsList>

        <TabsContent value="snapshots">
          <DataTable
            columns={snapshotColumns}
            data={snapshots}
            total={(snapshotsMeta as unknown as { total: number } | null)?.total ?? snapshots.length}
            page={snapshotPage}
            limit={limit}
            loading={snapshotsLoading}
            onPageChange={setSnapshotPage}
            emptyMessage="No trend snapshots found. Click 'Collect Now' to capture trends."
            toolbar={
              <div className="flex flex-wrap items-center gap-2">
                <Filter className="size-4 text-muted-foreground" />
                <Select value={snapshotCategory} onValueChange={(v) => { setSnapshotCategory(v); setSnapshotPage(1); }}>
                  <SelectTrigger size="sm" className="w-[150px]">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value || "__all__"}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={snapshotGeo} onValueChange={(v) => { setSnapshotGeo(v); setSnapshotPage(1); }}>
                  <SelectTrigger size="sm" className="w-[150px]">
                    <SelectValue placeholder="All Regions" />
                  </SelectTrigger>
                  <SelectContent>
                    {GEOS.map((g) => (
                      <SelectItem key={g.value} value={g.value || "__all__"}>
                        {g.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <DateRangePicker
                  from={snapshotDateRange.from}
                  to={snapshotDateRange.to}
                  onChange={(r) => { setSnapshotDateRange(r); setSnapshotPage(1); }}
                  className="h-8 text-xs"
                />
                <div className="flex items-center gap-1.5">
                  <Switch
                    checked={snapshotBreakout}
                    onCheckedChange={(v) => { setSnapshotBreakout(v); setSnapshotPage(1); }}
                    id="breakout-toggle"
                  />
                  <label htmlFor="breakout-toggle" className="text-xs text-muted-foreground cursor-pointer">
                    Breakout only
                  </label>
                </div>
              </div>
            }
          />
        </TabsContent>

        <TabsContent value="opportunities">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Filter className="size-4 text-muted-foreground" />
              <Select value={oppCategory} onValueChange={(v) => { setOppCategory(v === "__all__" ? "" : v); setOppPage(1); }}>
                <SelectTrigger size="sm" className="w-[150px]">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value || "__all__"}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={oppStatus} onValueChange={(v) => { setOppStatus(v === "__all__" ? "" : v); setOppPage(1); }}>
                <SelectTrigger size="sm" className="w-[140px]">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  {OPPORTUNITY_STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value || "__all__"}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <DataTable
              columns={opportunityColumns}
              data={opportunities}
              total={opportunities.length}
              page={oppPage}
              limit={limit}
              loading={oppsLoading}
              onPageChange={setOppPage}
              emptyMessage="No opportunities found. Click 'Analyze Now' to discover opportunities."
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
