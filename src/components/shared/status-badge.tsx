import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface StatusBadgeProps {
  status: string;
  colorMap?: Record<string, string>;
  size?: "sm" | "md";
}

const defaultColorMap: Record<string, string> = {
  ACTIVE: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/25",
  ENABLED: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/25",
  COMPLETED: "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/25",
  APPROVED: "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/25",
  DRAFT: "bg-zinc-500/15 text-zinc-700 dark:text-zinc-400 border-zinc-500/25",
  PENDING: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/25",
  REVIEW: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/25",
  PAUSED: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/25",
  FAILED: "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/25",
  ERROR: "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/25",
  CANCELLED: "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/25",
  BANNED: "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/25",
  PESSIMIZED: "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/25",
  SUSPENDED: "bg-orange-500/15 text-orange-700 dark:text-orange-400 border-orange-500/25",
  EXPIRED: "bg-zinc-500/15 text-zinc-700 dark:text-zinc-400 border-zinc-500/25",
  RUNNING: "bg-cyan-500/15 text-cyan-700 dark:text-cyan-400 border-cyan-500/25",
  IN_PROGRESS: "bg-cyan-500/15 text-cyan-700 dark:text-cyan-400 border-cyan-500/25",
};

export function StatusBadge({
  status,
  colorMap,
  size = "md",
}: StatusBadgeProps) {
  const merged = { ...defaultColorMap, ...colorMap };
  const colors =
    merged[status] ??
    "bg-zinc-500/15 text-zinc-700 dark:text-zinc-400 border-zinc-500/25";

  const label = status
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/^\w/, (c) => c.toUpperCase());

  return (
    <Badge
      variant="outline"
      className={cn(
        colors,
        size === "sm" && "text-[10px] px-1.5 py-0"
      )}
    >
      {label}
    </Badge>
  );
}
