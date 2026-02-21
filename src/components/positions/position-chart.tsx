"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PositionChartProps {
  data: Array<{ date: string; position: number | null }>;
  title?: string;
}

export function PositionChart({ data, title = "Position Over Time" }: PositionChartProps) {
  const chartData = data.map((d) => ({
    date: d.date,
    position: d.position,
  }));

  const positions = data.filter((d) => d.position != null).map((d) => d.position!);
  const minPos = positions.length > 0 ? Math.min(...positions) : 1;
  const maxPos = positions.length > 0 ? Math.max(...positions) : 100;
  const yMin = Math.max(1, minPos - 5);
  const yMax = maxPos + 10;

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
            No position data available
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11 }}
                className="text-muted-foreground"
                tickFormatter={(v: string) => {
                  const d = new Date(v);
                  return `${d.getMonth() + 1}/${d.getDate()}`;
                }}
              />
              <YAxis
                reversed
                domain={[yMin, yMax]}
                tick={{ fontSize: 11 }}
                className="text-muted-foreground"
                width={40}
                label={{ value: "Position", angle: -90, position: "insideLeft", style: { fontSize: 11 } }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
                labelFormatter={(label) => new Date(String(label)).toLocaleDateString()}
                formatter={(value) => [
                  value != null ? `#${value}` : "Not indexed",
                  "Position",
                ]}
              />
              <Line
                type="monotone"
                dataKey="position"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ r: 3, fill: "hsl(var(--primary))" }}
                activeDot={{ r: 5, fill: "hsl(var(--primary))" }}
                connectNulls={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
