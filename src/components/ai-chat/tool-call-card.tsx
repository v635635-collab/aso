"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  ChevronDownIcon,
  ChevronRightIcon,
  WrenchIcon,
  LoaderCircleIcon,
} from "lucide-react";
import type { ToolCallEvent } from "@/hooks/use-ai-chat";

const TOOL_LABELS: Record<string, string> = {
  query_keywords: "Keyword Search",
  query_apps: "App Search",
  query_niches: "Niche Lookup",
  query_campaigns: "Campaign Search",
  query_positions: "Position History",
  query_pessimizations: "Pessimization Events",
  get_system_stats: "System Stats",
};

export function ToolCallCard({ toolCall }: { toolCall: ToolCallEvent }) {
  const [expanded, setExpanded] = useState(false);
  const label = TOOL_LABELS[toolCall.name] ?? toolCall.name;

  let parsedArgs: Record<string, unknown> | null = null;
  try {
    parsedArgs = JSON.parse(toolCall.arguments);
  } catch {
    // Keep null
  }

  const resultArray = Array.isArray(toolCall.result) ? toolCall.result : null;
  const resultObj =
    !resultArray && toolCall.result && typeof toolCall.result === "object"
      ? toolCall.result
      : null;

  return (
    <div className="my-2 rounded-lg border border-border/60 bg-muted/30 text-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-muted/50 transition-colors"
      >
        {toolCall.isExecuting ? (
          <LoaderCircleIcon className="size-3.5 animate-spin text-primary" />
        ) : (
          <WrenchIcon className="size-3.5 text-muted-foreground" />
        )}
        <span className="font-medium text-foreground">{label}</span>
        {parsedArgs && Object.keys(parsedArgs).length > 0 && (
          <span className="text-xs text-muted-foreground truncate max-w-[200px]">
            {Object.entries(parsedArgs)
              .map(([k, v]) => `${k}: ${v}`)
              .join(", ")}
          </span>
        )}
        {resultArray && (
          <span className="ml-auto text-xs text-muted-foreground">
            {resultArray.length} result{resultArray.length !== 1 ? "s" : ""}
          </span>
        )}
        <span className="ml-auto">
          {expanded ? (
            <ChevronDownIcon className="size-3.5 text-muted-foreground" />
          ) : (
            <ChevronRightIcon className="size-3.5 text-muted-foreground" />
          )}
        </span>
      </button>

      {expanded && toolCall.result !== undefined && (
        <div className="border-t border-border/40 px-3 py-2">
          <pre
            className={cn(
              "text-xs leading-relaxed overflow-auto max-h-60",
              "text-muted-foreground whitespace-pre-wrap break-words"
            )}
          >
            {JSON.stringify(toolCall.result, null, 2)}
          </pre>
        </div>
      )}

      {expanded && toolCall.isExecuting && (
        <div className="border-t border-border/40 px-3 py-2 text-xs text-muted-foreground">
          Executing...
        </div>
      )}
    </div>
  );
}
