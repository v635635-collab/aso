"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  Sparkles,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { RampChart } from "@/components/campaigns/ramp-chart";
import { cn } from "@/lib/utils";

const STRATEGIES = [
  { value: "GRADUAL", label: "Gradual", desc: "Slow ramp, safest approach" },
  { value: "AGGRESSIVE", label: "Aggressive", desc: "Fast ramp, higher risk" },
  { value: "CONSERVATIVE", label: "Conservative", desc: "Very slow, minimal risk" },
  { value: "CUSTOM", label: "Custom", desc: "Balanced, AI-optimized" },
] as const;

interface AppData {
  id: string;
  name: string;
  iconUrl: string | null;
  bundleId: string;
  niche: { name: string; displayName: string } | null;
  keywords: {
    id: string;
    keyword: { id: string; text: string; trafficScore: number | null; difficulty: number | null };
  }[];
}

interface GeneratedPlan {
  campaignId: string;
  name: string;
  totalInstalls: number;
  dailyPlans?: { day: number; date: string; plannedInstalls: number; actualInstalls: number }[];
}

interface Props {
  apps: AppData[];
}

export function NewCampaignClient({ apps }: Props) {
  const router = useRouter();
  const [step, setStep] = React.useState(1);
  const totalSteps = 5;

  const [selectedAppId, setSelectedAppId] = React.useState("");
  const [selectedKeywords, setSelectedKeywords] = React.useState<string[]>([]);
  const [strategy, setStrategy] = React.useState<string>("GRADUAL");
  const [budget, setBudget] = React.useState(100);
  const [duration, setDuration] = React.useState(14);
  const [cpi, setCpi] = React.useState(0.15);

  const [generating, setGenerating] = React.useState(false);
  const [generatedPlan, setGeneratedPlan] = React.useState<GeneratedPlan | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const selectedApp = apps.find((a) => a.id === selectedAppId);

  const canNext = () => {
    switch (step) {
      case 1: return !!selectedAppId;
      case 2: return selectedKeywords.length > 0;
      case 3: return !!strategy;
      case 4: return budget > 0 && duration > 0 && cpi > 0;
      default: return true;
    }
  };

  const toggleKeyword = (text: string) => {
    setSelectedKeywords((prev) =>
      prev.includes(text) ? prev.filter((k) => k !== text) : [...prev, text]
    );
  };

  const generatePlan = async () => {
    setGenerating(true);
    setError(null);

    try {
      const res = await fetch("/api/campaigns/generate-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          appId: selectedAppId,
          targetKeywords: selectedKeywords,
          strategy,
          durationDays: duration,
          totalBudget: budget,
          costPerInstall: cpi,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error?.message || "Generation failed");

      const jobId = json.data.jobId;
      let attempts = 0;
      const maxAttempts = 30;

      while (attempts < maxAttempts) {
        await new Promise((r) => setTimeout(r, 2000));
        const jobRes = await fetch(`/api/jobs/${jobId}`, { credentials: "include" });
        const jobJson = await jobRes.json();

        if (!jobRes.ok) {
          attempts++;
          continue;
        }

        const job = jobJson.data;
        if (job.status === "COMPLETED" && job.output) {
          const campaignId = job.output.campaignId;
          const campRes = await fetch(`/api/campaigns/${campaignId}`, { credentials: "include" });
          const campJson = await campRes.json();

          if (campRes.ok && campJson.data) {
            setGeneratedPlan({
              campaignId: campJson.data.id,
              name: campJson.data.name,
              totalInstalls: campJson.data.totalInstalls,
              dailyPlans: campJson.data.dailyPlans,
            });
          } else {
            setGeneratedPlan({
              campaignId,
              name: job.output.name || "Generated Plan",
              totalInstalls: job.output.totalInstalls || 0,
            });
          }
          return;
        }

        if (job.status === "FAILED") {
          throw new Error(job.error || "Plan generation failed");
        }

        attempts++;
      }

      throw new Error("Generation timed out. Check the campaigns list for the result.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setGenerating(false);
    }
  };

  const stepLabels = ["Select App", "Keywords", "Strategy", "Budget", "Generate"];

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.push("/campaigns")}>
          <ArrowLeft className="size-4" />
        </Button>
        <h1 className="text-2xl font-bold">New Campaign</h1>
      </div>

      <div className="flex items-center gap-2 px-4">
        {stepLabels.map((label, idx) => {
          const stepNum = idx + 1;
          const isActive = step === stepNum;
          const isDone = step > stepNum;
          return (
            <React.Fragment key={label}>
              <div className="flex items-center gap-1.5">
                <div
                  className={cn(
                    "flex items-center justify-center size-7 rounded-full text-xs font-medium border-2 transition-colors",
                    isDone && "bg-primary border-primary text-primary-foreground",
                    isActive && "border-primary text-primary",
                    !isDone && !isActive && "border-muted-foreground/30 text-muted-foreground/50"
                  )}
                >
                  {isDone ? <Check className="size-3.5" /> : stepNum}
                </div>
                <span className={cn(
                  "text-xs font-medium hidden sm:inline",
                  (isDone || isActive) ? "text-foreground" : "text-muted-foreground/50"
                )}>
                  {label}
                </span>
              </div>
              {idx < stepLabels.length - 1 && (
                <div className={cn("flex-1 h-0.5", idx < step - 1 ? "bg-primary" : "bg-muted-foreground/20")} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      <Card>
        <CardContent className="pt-6">
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <Label className="text-base font-medium">Select an app</Label>
                <p className="text-sm text-muted-foreground mb-3">Choose which app this campaign is for.</p>
              </div>
              <div className="grid gap-2">
                {apps.map((app) => (
                  <button
                    key={app.id}
                    type="button"
                    onClick={() => {
                      setSelectedAppId(app.id);
                      setSelectedKeywords([]);
                    }}
                    className={cn(
                      "flex items-center gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-muted/50",
                      selectedAppId === app.id && "border-primary bg-primary/5"
                    )}
                  >
                    {app.iconUrl ? (
                      <img src={app.iconUrl} alt="" className="size-10 rounded-lg" />
                    ) : (
                      <div className="size-10 rounded-lg bg-muted flex items-center justify-center text-xs font-medium">
                        {app.name.charAt(0)}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="font-medium truncate">{app.name}</div>
                      <div className="text-xs text-muted-foreground">{app.bundleId}</div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {app.keywords.length} keywords
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && selectedApp && (
            <div className="space-y-4">
              <div>
                <Label className="text-base font-medium">Target keywords</Label>
                <p className="text-sm text-muted-foreground mb-3">
                  Select keywords to target with this campaign ({selectedKeywords.length} selected).
                </p>
              </div>
              {selectedApp.keywords.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">
                  No keywords tracked for this app. Add keywords first.
                </p>
              ) : (
                <div className="space-y-1 max-h-[400px] overflow-y-auto">
                  {selectedApp.keywords.map((ak) => (
                    <label
                      key={ak.id}
                      className={cn(
                        "flex items-center gap-3 rounded-lg border p-2.5 cursor-pointer transition-colors hover:bg-muted/50",
                        selectedKeywords.includes(ak.keyword.text) && "border-primary bg-primary/5"
                      )}
                    >
                      <Checkbox
                        checked={selectedKeywords.includes(ak.keyword.text)}
                        onCheckedChange={() => toggleKeyword(ak.keyword.text)}
                      />
                      <span className="flex-1 text-sm font-medium">{ak.keyword.text}</span>
                      <span className="text-xs text-muted-foreground">
                        Traffic: {ak.keyword.trafficScore ?? "—"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Diff: {ak.keyword.difficulty?.toFixed(0) ?? "—"}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div>
                <Label className="text-base font-medium">Push strategy</Label>
                <p className="text-sm text-muted-foreground mb-3">Choose how installs will be distributed.</p>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {STRATEGIES.map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => setStrategy(s.value)}
                    className={cn(
                      "rounded-lg border p-4 text-left transition-colors hover:bg-muted/50",
                      strategy === s.value && "border-primary bg-primary/5"
                    )}
                  >
                    <div className="font-medium">{s.label}</div>
                    <div className="text-xs text-muted-foreground mt-1">{s.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <div>
                <Label className="text-base font-medium">Budget & Duration</Label>
                <p className="text-sm text-muted-foreground mb-3">Set your campaign parameters.</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label>Total Budget ($)</Label>
                  <Input
                    type="number"
                    min={1}
                    value={budget}
                    onChange={(e) => setBudget(+e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Duration (days)</Label>
                  <Input
                    type="number"
                    min={1}
                    max={90}
                    value={duration}
                    onChange={(e) => setDuration(+e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Cost per Install ($)</Label>
                  <Input
                    type="number"
                    min={0.01}
                    step={0.01}
                    value={cpi}
                    onChange={(e) => setCpi(+e.target.value)}
                  />
                </div>
              </div>
              <div className="rounded-lg bg-muted/50 p-4 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Estimated installs:</span>
                  <span className="font-medium">{cpi > 0 ? Math.floor(budget / cpi) : 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Avg installs/day:</span>
                  <span className="font-medium">{cpi > 0 && duration > 0 ? Math.floor(budget / cpi / duration) : 0}</span>
                </div>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4">
              <div>
                <Label className="text-base font-medium">Generate AI Plan</Label>
                <p className="text-sm text-muted-foreground mb-3">
                  Review your selections and generate the campaign plan.
                </p>
              </div>

              <div className="rounded-lg bg-muted/50 p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">App:</span>
                  <span className="font-medium">{selectedApp?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Keywords:</span>
                  <span className="font-medium">{selectedKeywords.length} selected</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Strategy:</span>
                  <span className="font-medium">{strategy}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Budget:</span>
                  <span className="font-medium">${budget}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Duration:</span>
                  <span className="font-medium">{duration} days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">CPI:</span>
                  <span className="font-medium">${cpi.toFixed(2)}</span>
                </div>
              </div>

              {!generatedPlan && !generating && (
                <Button onClick={generatePlan} className="w-full" size="lg">
                  <Sparkles className="mr-2 size-4" />
                  Generate AI Plan
                </Button>
              )}

              {generating && (
                <div className="flex flex-col items-center py-8 gap-3">
                  <Loader2 className="size-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Generating plan with AI...</p>
                </div>
              )}

              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/20 p-4 flex gap-3">
                  <AlertTriangle className="size-5 text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-700 dark:text-red-400">Generation failed</p>
                    <p className="text-sm text-red-600 dark:text-red-300 mt-1">{error}</p>
                    <Button variant="outline" size="sm" className="mt-2" onClick={generatePlan}>
                      Retry
                    </Button>
                  </div>
                </div>
              )}

              {generatedPlan && (
                <div className="space-y-4">
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 p-4">
                    <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                      Plan generated: {generatedPlan.name}
                    </p>
                    <p className="text-sm text-emerald-600 dark:text-emerald-300 mt-1">
                      {generatedPlan.totalInstalls} total installs planned
                    </p>
                  </div>

                  {generatedPlan.dailyPlans && generatedPlan.dailyPlans.length > 0 && (
                    <RampChart
                      plans={generatedPlan.dailyPlans}
                      title="Planned Install Ramp"
                    />
                  )}

                  <Button
                    className="w-full"
                    onClick={() => router.push(`/campaigns/${generatedPlan.campaignId}`)}
                  >
                    View Campaign Details
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setStep((s) => Math.max(1, s - 1))}
          disabled={step === 1}
        >
          <ArrowLeft className="mr-2 size-4" />
          Back
        </Button>
        {step < totalSteps && (
          <Button onClick={() => setStep((s) => s + 1)} disabled={!canNext()}>
            Next
            <ArrowRight className="ml-2 size-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
