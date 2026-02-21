import { ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: React.ComponentType<{ className?: string }>;
  loading?: boolean;
  className?: string;
}

export function MetricCard({
  title,
  value,
  change,
  changeLabel,
  icon: Icon,
  loading = false,
  className,
}: MetricCardProps) {
  const isPositive = change !== undefined && change > 0;
  const isNegative = change !== undefined && change < 0;

  return (
    <Card className={cn("relative overflow-hidden", className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {Icon && <Icon className="size-4 text-muted-foreground" />}
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            <div className="h-8 w-20 animate-pulse rounded bg-muted" />
            <div className="h-3 w-32 animate-pulse rounded bg-muted" />
          </div>
        ) : (
          <>
            <div className="text-2xl font-bold">{value}</div>
            {change !== undefined && (
              <p
                className={cn(
                  "mt-1 flex items-center gap-1 text-xs",
                  isPositive && "text-emerald-600 dark:text-emerald-400",
                  isNegative && "text-red-600 dark:text-red-400",
                  !isPositive && !isNegative && "text-muted-foreground"
                )}
              >
                {isPositive && <ArrowUp className="size-3" />}
                {isNegative && <ArrowDown className="size-3" />}
                <span>
                  {isPositive && "+"}
                  {change.toFixed(1)}%
                </span>
                {changeLabel && (
                  <span className="text-muted-foreground">
                    {changeLabel}
                  </span>
                )}
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
