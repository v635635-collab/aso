"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Type, Sparkles, GitCompareArrows, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DataTable, type ColumnDef } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { TitleComparison } from "@/components/titles/title-comparison";
import { useApiMutation } from "@/hooks/use-api";

const TITLE_STATUSES = ["DRAFT", "APPROVED", "APPLIED", "REJECTED", "ARCHIVED"];
const STRATEGIES = [
  { value: "balanced", label: "Balanced" },
  { value: "traffic_first", label: "Traffic First" },
  { value: "readability_first", label: "Readability First" },
];

interface TitleVariantRow {
  id: string;
  title: string;
  subtitle: string | null;
  charCount: number;
  keywordsCovered: string[];
  keywordCount: number;
  trafficCovered: number;
  status: string;
  isActive: boolean;
  score: number | null;
  generatedBy: string;
  createdAt: string;
  app: { id: string; name: string; iconUrl: string | null; bundleId: string };
}

interface TitlesPageClientProps {
  variants: TitleVariantRow[];
  apps: { id: string; name: string }[];
  total: number;
  page: number;
  limit: number;
  status: string;
  appId: string;
}

export function TitlesPageClient({
  variants,
  apps,
  total,
  page,
  limit,
  status,
  appId,
}: TitlesPageClientProps) {
  const router = useRouter();
  const [selected, setSelected] = React.useState<TitleVariantRow[]>([]);
  const [compareOpen, setCompareOpen] = React.useState(false);
  const [generateOpen, setGenerateOpen] = React.useState(false);
  const [genAppId, setGenAppId] = React.useState(appId || "");
  const [genStrategy, setGenStrategy] = React.useState("balanced");

  const generateMutation = useApiMutation<
    { appId: string; strategy: string; maxVariants: number },
    { jobId: string; status: string }
  >("/api/titles/generate");

  const buildUrl = (overrides: Record<string, string | number>) => {
    const p = new URLSearchParams();
    const merged = { page: String(page), status, appId, ...overrides };
    for (const [k, v] of Object.entries(merged)) {
      if (v) p.set(k, String(v));
    }
    return `/titles?${p.toString()}`;
  };

  const handleGenerate = async () => {
    if (!genAppId) return;
    try {
      await generateMutation.trigger({
        appId: genAppId,
        strategy: genStrategy,
        maxVariants: 3,
      });
      setGenerateOpen(false);
      router.refresh();
    } catch {
      // error displayed via mutation state
    }
  };

  const columns: ColumnDef<Record<string, unknown>>[] = [
    {
      id: "app",
      header: "App",
      cell: (row) => {
        const r = row as unknown as TitleVariantRow;
        return <span className="text-sm font-medium">{r.app.name}</span>;
      },
    },
    {
      id: "title",
      header: "Title",
      cell: (row) => {
        const r = row as unknown as TitleVariantRow;
        return (
          <div className="max-w-md">
            <p className="text-sm font-medium leading-snug line-clamp-2">
              {r.title}
            </p>
            {r.subtitle && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {r.subtitle}
              </p>
            )}
          </div>
        );
      },
    },
    {
      id: "charCount",
      header: "Chars",
      sortable: true,
      className: "text-right w-20",
      cell: (row) => {
        const r = row as unknown as TitleVariantRow;
        return <span className="font-mono text-sm">{r.charCount}/200</span>;
      },
    },
    {
      id: "keywordCount",
      header: "Keywords",
      sortable: true,
      className: "text-right w-24",
      cell: (row) => {
        const r = row as unknown as TitleVariantRow;
        return <span className="font-mono text-sm">{r.keywordCount}</span>;
      },
    },
    {
      id: "trafficCovered",
      header: "Traffic",
      sortable: true,
      className: "text-right w-24",
      cell: (row) => {
        const r = row as unknown as TitleVariantRow;
        return (
          <span className="font-mono text-sm">
            {r.trafficCovered.toLocaleString()}
          </span>
        );
      },
    },
    {
      id: "score",
      header: "Score",
      sortable: true,
      className: "text-right w-20",
      cell: (row) => {
        const r = row as unknown as TitleVariantRow;
        return (
          <span className="font-mono text-sm font-medium">
            {r.score?.toFixed(1) ?? "—"}
          </span>
        );
      },
    },
    {
      id: "status",
      header: "Status",
      cell: (row) => {
        const r = row as unknown as TitleVariantRow;
        return <StatusBadge status={r.status} size="sm" />;
      },
    },
    {
      id: "generatedBy",
      header: "By",
      className: "w-20",
      cell: (row) => {
        const r = row as unknown as TitleVariantRow;
        return (
          <span className="text-xs text-muted-foreground">{r.generatedBy}</span>
        );
      },
    },
  ];

  const toolbar = (
    <>
      <Select
        value={appId || "__all__"}
        onValueChange={(v) =>
          router.push(buildUrl({ appId: v === "__all__" ? "" : v, page: 1 }))
        }
      >
        <SelectTrigger className="w-[180px] h-8 text-xs">
          <SelectValue placeholder="All apps" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">All apps</SelectItem>
          {apps.map((a) => (
            <SelectItem key={a.id} value={a.id}>
              {a.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={status || "__all__"}
        onValueChange={(v) =>
          router.push(buildUrl({ status: v === "__all__" ? "" : v, page: 1 }))
        }
      >
        <SelectTrigger className="w-[140px] h-8 text-xs">
          <SelectValue placeholder="All statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">All statuses</SelectItem>
          {TITLE_STATUSES.map((s) => (
            <SelectItem key={s} value={s}>
              {s.charAt(0) + s.slice(1).toLowerCase().replace(/_/g, " ")}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="flex-1" />

      {selected.length >= 2 && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => setCompareOpen(true)}
        >
          <GitCompareArrows className="mr-1 size-3.5" />
          Compare ({selected.length})
        </Button>
      )}

      <Button size="sm" onClick={() => setGenerateOpen(true)}>
        <Sparkles className="mr-1 size-3.5" />
        Generate Titles
      </Button>
    </>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Title Variants</h1>
        <p className="text-sm text-muted-foreground">
          AI-generated title variants optimized for keyword coverage and traffic.
        </p>
      </div>

      {variants.length === 0 && !status && !appId ? (
        <EmptyState
          icon={Type}
          title="No title variants yet"
          description="Generate title variants for your apps to maximize keyword coverage and organic traffic."
          action={{
            label: "Generate Titles",
            onClick: () => setGenerateOpen(true),
          }}
        />
      ) : (
        <DataTable
          columns={columns}
          data={variants as unknown as Record<string, unknown>[]}
          total={total}
          page={page}
          limit={limit}
          onPageChange={(p) => router.push(buildUrl({ page: p }))}
          toolbar={toolbar}
          selectable
          onSelectionChange={(rows) => setSelected(rows as unknown as TitleVariantRow[])}
          emptyMessage="No title variants match current filters."
        />
      )}

      <Dialog open={compareOpen} onOpenChange={setCompareOpen}>
        <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Compare Title Variants</DialogTitle>
            <DialogDescription>
              Side-by-side comparison of {selected.length} selected variants.
            </DialogDescription>
          </DialogHeader>
          {selected.length >= 2 && (
            <TitleComparison variants={selected.slice(0, 3)} />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={generateOpen} onOpenChange={setGenerateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate Title Variants</DialogTitle>
            <DialogDescription>
              Select an app and strategy to generate optimized title variants using AI.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">App</label>
              <Select value={genAppId} onValueChange={setGenAppId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an app" />
                </SelectTrigger>
                <SelectContent>
                  {apps.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Strategy</label>
              <Select value={genStrategy} onValueChange={setGenStrategy}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STRATEGIES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {generateMutation.error && (
              <div className="rounded-md bg-red-500/10 border border-red-500/20 px-3 py-2 text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
                <X className="size-4 shrink-0" />
                {generateMutation.error.message}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setGenerateOpen(false)}
              disabled={generateMutation.loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={!genAppId || generateMutation.loading}
            >
              {generateMutation.loading && (
                <Loader2 className="mr-1 size-3.5 animate-spin" />
              )}
              Generate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
