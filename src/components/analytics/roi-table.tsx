"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, type ColumnDef } from "@/components/shared/data-table";

interface ROICampaign {
  [key: string]: unknown;
  id: string;
  campaignName: string;
  appName: string;
  status: string;
  spend: number;
  installs: number;
  cpi: number;
  roiEstimate: number | null;
}

interface ROITableProps {
  campaigns: ROICampaign[];
  loading?: boolean;
}

const statusVariant: Record<string, "default" | "secondary" | "outline"> = {
  COMPLETED: "default",
  ACTIVE: "secondary",
  PAUSED: "outline",
};

const columns: ColumnDef<ROICampaign>[] = [
  {
    id: "campaignName",
    header: "Campaign",
    accessorKey: "campaignName",
    sortable: true,
  },
  {
    id: "appName",
    header: "App",
    accessorKey: "appName",
  },
  {
    id: "status",
    header: "Status",
    cell: (row) => (
      <Badge variant={statusVariant[row.status] ?? "outline"}>
        {row.status}
      </Badge>
    ),
  },
  {
    id: "spend",
    header: "Spend",
    sortable: true,
    cell: (row) => `$${row.spend.toFixed(2)}`,
    className: "text-right",
  },
  {
    id: "installs",
    header: "Installs",
    accessorKey: "installs",
    sortable: true,
    className: "text-right",
  },
  {
    id: "cpi",
    header: "CPI",
    sortable: true,
    cell: (row) => `$${row.cpi.toFixed(2)}`,
    className: "text-right",
  },
  {
    id: "roiEstimate",
    header: "ROI",
    sortable: true,
    cell: (row) =>
      row.roiEstimate !== null ? `${row.roiEstimate.toFixed(1)}%` : "—",
    className: "text-right",
  },
];

export function ROITable({ campaigns, loading = false }: ROITableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">ROI by Campaign</CardTitle>
      </CardHeader>
      <CardContent>
        <DataTable<ROICampaign>
          columns={columns}
          data={campaigns}
          loading={loading}
          emptyMessage="No completed campaigns yet"
          rowKey="id"
        />
      </CardContent>
    </Card>
  );
}
