"use client";

import { Check, Circle, Clock, X, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  { key: "DRAFT", label: "Draft" },
  { key: "REVIEW", label: "Review" },
  { key: "APPROVED", label: "Approved" },
  { key: "ACTIVE", label: "Active" },
  { key: "COMPLETED", label: "Completed" },
] as const;

const TERMINAL_STATES: Record<string, { label: string; icon: typeof AlertTriangle; color: string }> = {
  PAUSED: { label: "Paused", icon: Clock, color: "text-amber-500" },
  CANCELLED: { label: "Cancelled", icon: X, color: "text-red-500" },
  PESSIMIZED: { label: "Pessimized", icon: AlertTriangle, color: "text-red-500" },
};

interface CampaignTimelineProps {
  status: string;
  className?: string;
}

export function CampaignTimeline({ status, className }: CampaignTimelineProps) {
  const currentIdx = STEPS.findIndex((s) => s.key === status);
  const isTerminal = status in TERMINAL_STATES;

  const activeStepIdx = isTerminal
    ? STEPS.findIndex((s) => s.key === "ACTIVE")
    : currentIdx;

  return (
    <div className={cn("flex items-center gap-0", className)}>
      {STEPS.map((step, idx) => {
        const isCompleted = idx < activeStepIdx || (!isTerminal && idx <= currentIdx && status === "COMPLETED");
        const isCurrent = !isTerminal && idx === currentIdx;

        return (
          <div key={step.key} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "flex items-center justify-center size-7 rounded-full border-2 transition-colors",
                  isCompleted && "bg-primary border-primary",
                  isCurrent && "border-primary bg-primary/10",
                  !isCompleted && !isCurrent && "border-muted-foreground/30 bg-background"
                )}
              >
                {isCompleted ? (
                  <Check className="size-3.5 text-primary-foreground" />
                ) : isCurrent ? (
                  <Circle className="size-2.5 fill-primary text-primary" />
                ) : (
                  <Circle className="size-2.5 text-muted-foreground/30" />
                )}
              </div>
              <span
                className={cn(
                  "mt-1.5 text-[10px] font-medium",
                  (isCompleted || isCurrent) ? "text-foreground" : "text-muted-foreground/50"
                )}
              >
                {step.label}
              </span>
            </div>
            {idx < STEPS.length - 1 && (
              <div
                className={cn(
                  "h-0.5 w-8 mx-1 mt-[-18px]",
                  idx < activeStepIdx ? "bg-primary" : "bg-muted-foreground/20"
                )}
              />
            )}
          </div>
        );
      })}

      {isTerminal && TERMINAL_STATES[status] && (
        <>
          <div className="h-0.5 w-8 mx-1 mt-[-18px] bg-red-500/50" />
          <div className="flex flex-col items-center">
            <div className={cn("flex items-center justify-center size-7 rounded-full border-2 border-red-500 bg-red-500/10")}>
              {(() => {
                const Icon = TERMINAL_STATES[status].icon;
                return <Icon className="size-3.5 text-red-500" />;
              })()}
            </div>
            <span className="mt-1.5 text-[10px] font-medium text-red-500">
              {TERMINAL_STATES[status].label}
            </span>
          </div>
        </>
      )}
    </div>
  );
}
