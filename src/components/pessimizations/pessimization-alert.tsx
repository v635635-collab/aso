"use client";

import Link from "next/link";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SeverityBadge } from "./severity-badge";

interface PessimizationAlertProps {
  event: {
    id: string;
    type: string;
    severity: "MINOR" | "MODERATE" | "SEVERE" | "CRITICAL";
    status: string;
    avgPositionDrop: number;
    affectedKeywords: unknown[];
    detectedAt: string;
    app: { id: string; name: string };
  };
  className?: string;
}

const severityBorder: Record<string, string> = {
  MINOR: "border-yellow-500/30",
  MODERATE: "border-orange-500/30",
  SEVERE: "border-red-500/30",
  CRITICAL: "border-rose-700/40 bg-rose-500/5",
};

export function PessimizationAlert({ event, className }: PessimizationAlertProps) {
  const keywords = Array.isArray(event.affectedKeywords) ? event.affectedKeywords : [];

  return (
    <Card className={cn("border-l-4", severityBorder[event.severity], className)}>
      <CardContent className="flex items-start gap-3 p-4">
        <div className={cn(
          "mt-0.5 rounded-full p-1.5",
          event.severity === "CRITICAL" || event.severity === "SEVERE"
            ? "bg-red-500/10 text-red-500"
            : "bg-amber-500/10 text-amber-500"
        )}>
          <AlertTriangle className="h-4 w-4" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-sm truncate">{event.app.name}</span>
            <SeverityBadge severity={event.severity} size="sm" />
          </div>
          <p className="text-xs text-muted-foreground">
            {keywords.length} keyword{keywords.length !== 1 ? "s" : ""} affected
            {event.avgPositionDrop > 0 && ` · Avg drop: ${event.avgPositionDrop.toFixed(1)}`}
          </p>
          <p className="text-[11px] text-muted-foreground/70 mt-1">
            {new Date(event.detectedAt).toLocaleString()}
          </p>
        </div>

        <Button variant="ghost" size="sm" className="shrink-0" asChild>
          <Link href={`/pessimizations/${event.id}`}>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
