"use client";

import { useState, useMemo } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { DateRangePicker } from "@/components/shared/date-range-picker";
import { OverviewCards } from "@/components/analytics/overview-cards";
import { SpendChart } from "@/components/analytics/spend-chart";
import { ROITable } from "@/components/analytics/roi-table";
import { TrendChart } from "@/components/analytics/trend-chart";
import { useApi } from "@/hooks/use-api";
import { ErrorBoundary } from "@/components/shared/error-boundary";

interface SpendData {
  monthly: { month: string; spend: number; installs: number }[];
  totalSpend: number;
  totalInstalls: number;
  avgCPI: number;
  currency: string;
}

interface ROIData {
  campaigns: {
    id: string;
    campaignName: string;
    appName: string;
    status: string;
    spend: number;
    installs: number;
    cpi: number;
    roiEstimate: number | null;
  }[];
  totalSpend: number;
  totalInstalls: number;
  averageROI: number;
}

interface KeywordData {
  keywords: {
    id: string;
    text: string;
    trafficScore: number;
    sap: number;
    competition: number;
    difficulty: number;
    position: number | null;
    bestPosition: number | null;
    trend: string;
    trackedApps: number;
    appName: string | null;
  }[];
  summary: {
    totalTracked: number;
    improved: number;
    declined: number;
    unchanged: number;
    newEntries: number;
  };
}

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(Date.now() - 90 * 86400000),
    to: new Date(),
  });

  const months = useMemo(() => {
    const diff =
      (dateRange.to.getFullYear() - dateRange.from.getFullYear()) * 12 +
      (dateRange.to.getMonth() - dateRange.from.getMonth());
    return Math.max(1, diff + 1);
  }, [dateRange]);

  const { data: spendData, loading: spendLoading } = useApi<SpendData>(
    `/api/analytics/spend?months=${months}`
  );
  const { data: roiData, loading: roiLoading } = useApi<ROIData>(
    "/api/analytics/roi"
  );
  const { data: kwData, loading: kwLoading } = useApi<KeywordData>(
    "/api/analytics/keyword-performance?limit=20"
  );

  const activeApps = kwData
    ? new Set(kwData.keywords.map((k) => k.appName).filter(Boolean)).size
    : 0;

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        <PageHeader
          title="Analytics"
          description="Track performance metrics across your apps and campaigns."
          actions={
            <DateRangePicker
              from={dateRange.from}
              to={dateRange.to}
              onChange={setDateRange}
            />
          }
        />

        <OverviewCards
          totalSpend={spendData?.totalSpend ?? 0}
          totalInstalls={spendData?.totalInstalls ?? 0}
          avgCPI={spendData?.avgCPI ?? 0}
          activeApps={activeApps}
          loading={spendLoading}
        />

        <SpendChart
          data={spendData?.monthly ?? []}
          loading={spendLoading}
        />

        <div className="grid gap-6 lg:grid-cols-2">
          <TrendChart
            keywords={kwData?.keywords ?? []}
            loading={kwLoading}
          />
          <ROITable
            campaigns={roiData?.campaigns ?? []}
            loading={roiLoading}
          />
        </div>
      </div>
    </ErrorBoundary>
  );
}
