"use client";

import {
  DollarSign,
  Download,
  TrendingDown,
  AppWindow,
} from "lucide-react";
import { MetricCard } from "@/components/shared/metric-card";

interface OverviewCardsProps {
  totalSpend: number;
  totalInstalls: number;
  avgCPI: number;
  activeApps: number;
  previousSpend?: number;
  previousInstalls?: number;
  previousCPI?: number;
  previousApps?: number;
  loading?: boolean;
}

function pctChange(current: number, previous?: number): number | undefined {
  if (previous === undefined || previous === 0) return undefined;
  return ((current - previous) / previous) * 100;
}

export function OverviewCards({
  totalSpend,
  totalInstalls,
  avgCPI,
  activeApps,
  previousSpend,
  previousInstalls,
  previousCPI,
  previousApps,
  loading = false,
}: OverviewCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <MetricCard
        title="Total Spend"
        value={`$${totalSpend.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
        icon={DollarSign}
        change={pctChange(totalSpend, previousSpend)}
        changeLabel="vs prev period"
        loading={loading}
      />
      <MetricCard
        title="Total Installs"
        value={totalInstalls.toLocaleString()}
        icon={Download}
        change={pctChange(totalInstalls, previousInstalls)}
        changeLabel="vs prev period"
        loading={loading}
      />
      <MetricCard
        title="Avg CPI"
        value={`$${avgCPI.toFixed(2)}`}
        icon={TrendingDown}
        change={pctChange(avgCPI, previousCPI)}
        changeLabel="vs prev period"
        loading={loading}
      />
      <MetricCard
        title="Active Apps"
        value={activeApps}
        icon={AppWindow}
        change={pctChange(activeApps, previousApps)}
        changeLabel="vs prev period"
        loading={loading}
      />
    </div>
  );
}
