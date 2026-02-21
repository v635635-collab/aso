"use client";

import Link from "next/link";
import { AlertTriangle, CheckCircle2, Eye, Search, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { SeverityBadge } from "./severity-badge";

interface TimelineEvent {
  id: string;
  type: string;
  severity: "MINOR" | "MODERATE" | "SEVERE" | "CRITICAL";
  status: string;
  avgPositionDrop: number;
  affectedKeywords: unknown[];
  detectedAt: string;
  resolvedAt?: string | null;
}

interface PessimizationTimelineProps {
  events: TimelineEvent[];
}

const statusIcon: Record<string, typeof AlertTriangle> = {
  DETECTED: AlertTriangle,
  ANALYZING: Search,
  MITIGATING: ShieldAlert,
  RESOLVED: CheckCircle2,
  ACCEPTED: Eye,
};

const statusColor: Record<string, string> = {
  DETECTED: "text-amber-500",
  ANALYZING: "text-blue-500",
  MITIGATING: "text-orange-500",
  RESOLVED: "text-emerald-500",
  ACCEPTED: "text-zinc-400",
};

export function PessimizationTimeline({ events }: PessimizationTimelineProps) {
  if (events.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-muted-foreground">
        No pessimization events recorded
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />

      <div className="space-y-0">
        {events.map((event, idx) => {
          const Icon = statusIcon[event.status] ?? AlertTriangle;
          const color = statusColor[event.status] ?? "text-muted-foreground";
          const keywords = Array.isArray(event.affectedKeywords) ? event.affectedKeywords : [];
          const isLast = idx === events.length - 1;

          return (
            <div key={event.id} className={cn("relative flex gap-4 pb-6", isLast && "pb-0")}>
              <div className={cn("relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border bg-card", color)}>
                <Icon className="h-3.5 w-3.5" />
              </div>

              <div className="flex-1 min-w-0 pt-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <Link
                    href={`/pessimizations/${event.id}`}
                    className="text-sm font-medium hover:underline"
                  >
                    {event.type.replace(/_/g, " ")}
                  </Link>
                  <SeverityBadge severity={event.severity} size="sm" />
                </div>

                <p className="text-xs text-muted-foreground mt-0.5">
                  {keywords.length} keyword{keywords.length !== 1 ? "s" : ""} ·
                  Avg drop: {event.avgPositionDrop.toFixed(1)} ·
                  Status: {event.status.toLowerCase()}
                </p>

                <p className="text-[11px] text-muted-foreground/70 mt-1">
                  {new Date(event.detectedAt).toLocaleString()}
                  {event.resolvedAt && (
                    <span> · Resolved {new Date(event.resolvedAt).toLocaleString()}</span>
                  )}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
