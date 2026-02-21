"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Play,
  Pause,
  XCircle,
  CheckCircle,
  Send,
  Download,
  Clock,
  DollarSign,
  Target,
  TrendingUp,
  FileText,
  History,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MetricCard } from "@/components/shared/metric-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { CampaignTimeline } from "@/components/campaigns/campaign-timeline";
import { DailyPlanTable } from "@/components/campaigns/daily-plan-table";
import { RampChart } from "@/components/campaigns/ramp-chart";
import { useApiMutation } from "@/hooks/use-api";

interface Campaign {
  id: string;
  name: string;
  status: string;
  strategy: string;
  targetKeywords: string[];
  targetCountry: string;
  totalBudget: number;
  spentBudget: number;
  costPerInstall: number | null;
  totalInstalls: number;
  completedInstalls: number;
  durationDays: number;
  aiReasoning: string | null;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  app: {
    id: string;
    name: string;
    iconUrl: string | null;
    bundleId: string;
    categoryRank: number | null;
    organicDownloads: number;
  };
  dailyPlans: {
    id: string;
    day: number;
    date: string;
    plannedInstalls: number;
    actualInstalls: number;
    cost: number;
    status: string;
    notes: string | null;
  }[];
  pessimizations: {
    id: string;
    type: string;
    severity: string;
    detectedAt: string;
    avgPositionDrop: number;
  }[];
  versions: {
    id: string;
    version: number;
    changeDescription: string | null;
    changedBy: string;
    status: string;
    createdAt: string;
  }[];
}

interface Props {
  campaign: Campaign;
}

type ConfirmAction = "review" | "approve" | "start" | "pause" | "cancel" | null;

export function CampaignDetailClient({ campaign: initial }: Props) {
  const router = useRouter();
  const [campaign, setCampaign] = React.useState(initial);
  const [confirmAction, setConfirmAction] = React.useState<ConfirmAction>(null);
  const [exportFormat, setExportFormat] = React.useState<string | null>(null);

  const reviewMut = useApiMutation(`/api/campaigns/${campaign.id}/review`);
  const approveMut = useApiMutation(`/api/campaigns/${campaign.id}/approve`);
  const startMut = useApiMutation(`/api/campaigns/${campaign.id}/start`);
  const pauseMut = useApiMutation(`/api/campaigns/${campaign.id}/pause`);
  const cancelMut = useApiMutation(`/api/campaigns/${campaign.id}/cancel`);
  const exportMut = useApiMutation<{ format: string }, { format: string; content: string }>(
    `/api/campaigns/${campaign.id}/export`
  );

  const refresh = async () => {
    const res = await fetch(`/api/campaigns/${campaign.id}`, { credentials: "include" });
    const json = await res.json();
    if (json.success) setCampaign(json.data);
  };

  const handleAction = async () => {
    if (!confirmAction) return;
    const actionMap = { review: reviewMut, approve: approveMut, start: startMut, pause: pauseMut, cancel: cancelMut };
    await actionMap[confirmAction].trigger();
    await refresh();
    setConfirmAction(null);
  };

  const handleExport = async (format: string) => {
    const result = await exportMut.trigger({ format });
    const blob = new Blob([result.content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${campaign.name.replace(/\s+/g, "_")}.${format === "json" ? "json" : format === "csv" ? "csv" : "txt"}`;
    a.click();
    URL.revokeObjectURL(url);
    setExportFormat(null);
  };

  const handleDailyUpdate = async (day: number, data: { actualInstalls?: number; cost?: number }) => {
    await fetch(`/api/campaigns/${campaign.id}/daily/${day}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    });
    await refresh();
  };

  const completedDays = campaign.dailyPlans.filter((d) => d.status === "COMPLETED").length;
  const progress = campaign.totalInstalls > 0
    ? Math.round((campaign.completedInstalls / campaign.totalInstalls) * 100)
    : 0;

  const confirmLabels: Record<string, { title: string; desc: string; label: string; variant?: "destructive" }> = {
    review: { title: "Submit for Review", desc: "This will submit the campaign for review.", label: "Submit" },
    approve: { title: "Approve Campaign", desc: "This will approve the campaign and make it ready to start.", label: "Approve" },
    start: { title: "Start Campaign", desc: "This will activate the campaign and begin daily push execution.", label: "Start" },
    pause: { title: "Pause Campaign", desc: "This will pause the active campaign. You can resume later.", label: "Pause" },
    cancel: { title: "Cancel Campaign", desc: "This will permanently cancel the campaign.", label: "Cancel", variant: "destructive" },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Button variant="ghost" size="icon" onClick={() => router.push("/campaigns")}>
            <ArrowLeft className="size-4" />
          </Button>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold truncate">{campaign.name}</h1>
              <StatusBadge status={campaign.status} />
            </div>
            <p className="text-sm text-muted-foreground">
              {campaign.app.name} &middot; {campaign.strategy} &middot; {campaign.durationDays} days
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {campaign.status === "DRAFT" && (
            <Button variant="outline" onClick={() => setConfirmAction("review")}>
              <Send className="mr-2 size-4" />Review
            </Button>
          )}
          {campaign.status === "REVIEW" && (
            <Button onClick={() => setConfirmAction("approve")}>
              <CheckCircle className="mr-2 size-4" />Approve
            </Button>
          )}
          {(campaign.status === "APPROVED" || campaign.status === "PAUSED") && (
            <Button onClick={() => setConfirmAction("start")}>
              <Play className="mr-2 size-4" />
              {campaign.status === "PAUSED" ? "Resume" : "Start"}
            </Button>
          )}
          {campaign.status === "ACTIVE" && (
            <Button variant="outline" onClick={() => setConfirmAction("pause")}>
              <Pause className="mr-2 size-4" />Pause
            </Button>
          )}
          {!["COMPLETED", "CANCELLED"].includes(campaign.status) && (
            <Button variant="outline" onClick={() => setConfirmAction("cancel")}>
              <XCircle className="mr-2 size-4" />Cancel
            </Button>
          )}
          <div className="relative">
            <Button variant="outline" onClick={() => setExportFormat(exportFormat ? null : "menu")}>
              <Download className="mr-2 size-4" />Export
            </Button>
            {exportFormat === "menu" && (
              <div className="absolute right-0 top-full mt-1 z-10 rounded-md border bg-popover p-1 shadow-md min-w-[120px]">
                {(["text", "csv", "json"] as const).map((f) => (
                  <button
                    key={f}
                    className="flex w-full items-center rounded-sm px-2 py-1.5 text-sm hover:bg-muted"
                    onClick={() => handleExport(f)}
                  >
                    {f.toUpperCase()}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <CampaignTimeline status={campaign.status} />

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Total Installs" value={`${campaign.completedInstalls}/${campaign.totalInstalls}`} icon={TrendingUp} />
        <MetricCard title="Budget" value={`$${campaign.spentBudget.toFixed(0)} / $${campaign.totalBudget.toFixed(0)}`} icon={DollarSign} />
        <MetricCard title="Progress" value={`${progress}%`} icon={Target} />
        <MetricCard title="Days" value={`${completedDays}/${campaign.durationDays}`} icon={Clock} />
      </div>

      <Tabs defaultValue="daily" className="space-y-4">
        <TabsList>
          <TabsTrigger value="daily">Daily Plan</TabsTrigger>
          <TabsTrigger value="chart">Ramp Chart</TabsTrigger>
          <TabsTrigger value="reasoning">AI Reasoning</TabsTrigger>
          <TabsTrigger value="versions">History</TabsTrigger>
        </TabsList>

        <TabsContent value="daily">
          <DailyPlanTable
            plans={campaign.dailyPlans}
            costPerInstall={campaign.costPerInstall || 0}
            editable={["ACTIVE", "PAUSED"].includes(campaign.status)}
            onUpdate={handleDailyUpdate}
          />
        </TabsContent>

        <TabsContent value="chart">
          <RampChart plans={campaign.dailyPlans} title="Planned vs Actual Installs" />
        </TabsContent>

        <TabsContent value="reasoning">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="size-4" /> AI Reasoning
              </CardTitle>
            </CardHeader>
            <CardContent>
              {campaign.aiReasoning ? (
                <div className="whitespace-pre-wrap text-sm text-muted-foreground leading-relaxed">
                  {campaign.aiReasoning}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No AI reasoning available for this campaign.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="versions">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <History className="size-4" /> Version History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {campaign.versions.length === 0 ? (
                <p className="text-sm text-muted-foreground">No version history yet.</p>
              ) : (
                <div className="space-y-3">
                  {campaign.versions.map((v) => (
                    <div key={v.id} className="flex items-start gap-3 rounded-lg border p-3">
                      <div className="flex items-center justify-center size-8 rounded-full bg-muted text-xs font-medium">
                        v{v.version}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <StatusBadge status={v.status} size="sm" />
                          <span className="text-xs text-muted-foreground">
                            {new Date(v.createdAt).toLocaleString()}
                          </span>
                        </div>
                        {v.changeDescription && (
                          <p className="text-sm text-muted-foreground mt-1">{v.changeDescription}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {campaign.targetKeywords.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Target Keywords</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {campaign.targetKeywords.map((kw) => (
                <span key={kw} className="inline-flex items-center rounded-md border bg-muted px-2.5 py-1 text-sm">
                  {kw}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {campaign.pessimizations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base text-red-600">Pessimization Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {campaign.pessimizations.map((p) => (
                <div key={p.id} className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/20 p-3">
                  <StatusBadge status={p.severity} size="sm" />
                  <div className="flex-1">
                    <span className="text-sm font-medium">{p.type.replace(/_/g, " ")}</span>
                    <span className="text-xs text-muted-foreground ml-2">
                      Avg drop: {p.avgPositionDrop.toFixed(1)} positions
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(p.detectedAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {confirmAction && confirmLabels[confirmAction] && (
        <ConfirmDialog
          open={!!confirmAction}
          onOpenChange={(open) => !open && setConfirmAction(null)}
          title={confirmLabels[confirmAction].title}
          description={confirmLabels[confirmAction].desc}
          confirmLabel={confirmLabels[confirmAction].label}
          variant={confirmLabels[confirmAction].variant === "destructive" ? "destructive" : "default"}
          onConfirm={handleAction}
        />
      )}
    </div>
  );
}
