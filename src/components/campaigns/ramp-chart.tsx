"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DailyPlanData {
  day: number;
  date: string;
  plannedInstalls: number;
  actualInstalls: number;
}

interface RampChartProps {
  plans: DailyPlanData[];
  title?: string;
  className?: string;
}

export function RampChart({ plans, title = "Install Ramp", className }: RampChartProps) {
  const data = plans.map((p) => ({
    day: `D${p.day}`,
    Planned: p.plannedInstalls,
    Actual: p.actualInstalls > 0 ? p.actualInstalls : null,
  }));

  const hasActual = plans.some((p) => p.actualInstalls > 0);

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="day"
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                tickLine={false}
                axisLine={{ stroke: 'hsl(var(--border))' }}
              />
              <YAxis
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                tickLine={false}
                axisLine={{ stroke: 'hsl(var(--border))' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px',
                  fontSize: '12px',
                }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
              />
              <Legend
                wrapperStyle={{ fontSize: '12px' }}
              />
              <Line
                type="monotone"
                dataKey="Planned"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ r: 3, fill: 'hsl(var(--primary))' }}
                strokeDasharray="5 5"
              />
              {hasActual && (
                <Line
                  type="monotone"
                  dataKey="Actual"
                  stroke="hsl(var(--chart-2, 142 71% 45%))"
                  strokeWidth={2}
                  dot={{ r: 3, fill: 'hsl(var(--chart-2, 142 71% 45%))' }}
                  connectNulls={false}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
