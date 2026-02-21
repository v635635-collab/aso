"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartSkeleton } from "@/components/shared/loading-skeleton";

interface KeywordData {
  id: string;
  text: string;
  trafficScore: number;
  position: number | null;
  trend: string;
}

interface TrendChartProps {
  keywords: KeywordData[];
  loading?: boolean;
}

function trendColor(trend: string): string {
  switch (trend) {
    case "RISING":
      return "hsl(var(--chart-2))";
    case "FALLING":
      return "hsl(var(--destructive))";
    case "NEW":
      return "hsl(var(--chart-4))";
    default:
      return "hsl(var(--primary))";
  }
}

export function TrendChart({ keywords, loading = false }: TrendChartProps) {
  if (loading) return <ChartSkeleton />;

  const chartData = keywords.slice(0, 10).map((kw) => ({
    name: kw.text.length > 18 ? kw.text.slice(0, 16) + "…" : kw.text,
    fullName: kw.text,
    traffic: kw.trafficScore,
    trend: kw.trend,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          Top Keywords by Traffic
        </CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
            No keyword data available yet
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                horizontal={false}
                className="stroke-muted"
              />
              <XAxis
                type="number"
                tick={{ fontSize: 12 }}
                className="fill-muted-foreground"
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={130}
                tick={{ fontSize: 11 }}
                className="fill-muted-foreground"
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  borderColor: "hsl(var(--border))",
                  borderRadius: 8,
                  fontSize: 12,
                }}
                labelStyle={{ color: "hsl(var(--foreground))" }}
                formatter={(value) => [Number(value), "Traffic Score"]}
                labelFormatter={(_label, payload) =>
                  (payload as Array<{ payload?: { fullName?: string } }>)?.[0]?.payload?.fullName ?? String(_label)
                }
              />
              <Bar dataKey="traffic" radius={[0, 4, 4, 0]} maxBarSize={28}>
                {chartData.map((entry, idx) => (
                  <Cell key={idx} fill={trendColor(entry.trend)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
