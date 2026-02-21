import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface SeverityBadgeProps {
  severity: "MINOR" | "MODERATE" | "SEVERE" | "CRITICAL";
  size?: "sm" | "md";
}

const severityConfig: Record<string, { label: string; className: string }> = {
  MINOR: {
    label: "Minor",
    className: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-500/25",
  },
  MODERATE: {
    label: "Moderate",
    className: "bg-orange-500/15 text-orange-700 dark:text-orange-400 border-orange-500/25",
  },
  SEVERE: {
    label: "Severe",
    className: "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/25",
  },
  CRITICAL: {
    label: "Critical",
    className: "bg-rose-900/20 text-rose-700 dark:text-rose-300 border-rose-700/30",
  },
};

export function SeverityBadge({ severity, size = "md" }: SeverityBadgeProps) {
  const config = severityConfig[severity] ?? severityConfig.MINOR;

  return (
    <Badge
      variant="outline"
      className={cn(
        config.className,
        size === "sm" && "text-[10px] px-1.5 py-0"
      )}
    >
      {config.label}
    </Badge>
  );
}
