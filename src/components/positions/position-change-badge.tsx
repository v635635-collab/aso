import { ArrowUp, ArrowDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface PositionChangeBadgeProps {
  change: number | null;
  size?: "sm" | "md";
}

export function PositionChangeBadge({ change, size = "md" }: PositionChangeBadgeProps) {
  const isSmall = size === "sm";

  if (change == null || change === 0) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-0.5 text-muted-foreground",
          isSmall ? "text-xs" : "text-sm"
        )}
      >
        <Minus className={isSmall ? "h-3 w-3" : "h-3.5 w-3.5"} />
        <span>0</span>
      </span>
    );
  }

  const improved = change > 0;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 font-medium",
        improved
          ? "text-emerald-600 dark:text-emerald-400"
          : "text-red-600 dark:text-red-400",
        isSmall ? "text-xs" : "text-sm"
      )}
    >
      {improved ? (
        <ArrowUp className={isSmall ? "h-3 w-3" : "h-3.5 w-3.5"} />
      ) : (
        <ArrowDown className={isSmall ? "h-3 w-3" : "h-3.5 w-3.5"} />
      )}
      <span>
        {improved ? "+" : ""}
        {change}
      </span>
    </span>
  );
}
