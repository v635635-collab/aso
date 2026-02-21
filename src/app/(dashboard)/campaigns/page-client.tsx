"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable, type ColumnDef } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";

const STATUSES = [
  "DRAFT", "REVIEW", "APPROVED", "ACTIVE",
  "PAUSED", "COMPLETED", "CANCELLED", "PESSIMIZED",
];

interface Campaign {
  id: string;
  name: string;
  status: string;
  strategy: string;
  totalBudget: number;
  totalInstalls: number;
  completedInstalls: number;
  durationDays: number;
  startDate: string | null;
  createdAt: string;
  app: { id: string; name: string; iconUrl: string | null; bundleId: string };
}

interface Props {
  campaigns: Campaign[];
  apps: { id: string; name: string }[];
  total: number;
  page: number;
  limit: number;
  status: string;
  appId: string;
  search: string;
}

const columns: ColumnDef<Campaign>[] = [
  {
    id: "name",
    header: "Campaign",
    sortable: true,
    cell: (row) => (
      <div>
        <div className="font-medium">{row.name}</div>
        <div className="text-xs text-muted-foreground">{row.app.name}</div>
      </div>
    ),
  },
  {
    id: "status",
    header: "Status",
    cell: (row) => <StatusBadge status={row.status} />,
  },
  {
    id: "strategy",
    header: "Strategy",
    accessorKey: "strategy",
    className: "hidden md:table-cell",
  },
  {
    id: "budget",
    header: "Budget",
    sortable: true,
    cell: (row) => `$${row.totalBudget.toFixed(0)}`,
    className: "text-right hidden lg:table-cell",
  },
  {
    id: "installs",
    header: "Installs",
    sortable: true,
    cell: (row) => (
      <span>
        {row.completedInstalls}/{row.totalInstalls}
      </span>
    ),
    className: "text-right",
  },
  {
    id: "duration",
    header: "Duration",
    cell: (row) => `${row.durationDays}d`,
    className: "text-right hidden md:table-cell",
  },
  {
    id: "date",
    header: "Created",
    sortable: true,
    cell: (row) => new Date(row.createdAt).toLocaleDateString(),
    className: "hidden lg:table-cell",
  },
];

export function CampaignsPageClient({
  campaigns,
  apps,
  total,
  page,
  limit,
  status,
  appId,
  search,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateParams = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([k, v]) => {
      if (v) params.set(k, v);
      else params.delete(k);
    });
    if (updates.page === undefined) params.delete("page");
    router.push(`/campaigns?${params.toString()}`);
  };

  if (campaigns.length === 0 && !status && !appId && !search) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Campaigns</h1>
        </div>
        <EmptyState
          title="No campaigns yet"
          description="Create your first push campaign to start driving installs for your apps."
          action={{
            label: "Create Campaign",
            onClick: () => router.push("/campaigns/new"),
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Campaigns</h1>
        <Button onClick={() => router.push("/campaigns/new")}>
          <Plus className="mr-2 size-4" />
          Create Campaign
        </Button>
      </div>

      <DataTable<Campaign & Record<string, unknown>>
        columns={columns as ColumnDef<Campaign & Record<string, unknown>>[]}
        data={campaigns as (Campaign & Record<string, unknown>)[]}
        total={total}
        page={page}
        limit={limit}
        onPageChange={(p) => updateParams({ page: String(p) })}
        toolbar={
          <>
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <Input
                placeholder="Search campaigns..."
                defaultValue={search}
                className="pl-9"
                onKeyDown={(e) => {
                  if (e.key === "Enter") updateParams({ search: e.currentTarget.value });
                }}
              />
            </div>
            <Select value={status || "all"} onValueChange={(v) => updateParams({ status: v === "all" ? "" : v })}>
              <SelectTrigger className="w-[140px]">
                <Filter className="mr-2 size-3.5" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={appId || "all"} onValueChange={(v) => updateParams({ appId: v === "all" ? "" : v })}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="All apps" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All apps</SelectItem>
                {apps.map((a) => (
                  <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </>
        }
      />
    </div>
  );
}
