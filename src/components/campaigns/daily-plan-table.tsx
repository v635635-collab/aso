"use client";

import * as React from "react";
import { Check, X, Pencil } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/shared/status-badge";
import { cn } from "@/lib/utils";

interface DailyPlan {
  id: string;
  day: number;
  date: string;
  plannedInstalls: number;
  actualInstalls: number;
  cost: number;
  status: string;
  notes: string | null;
}

interface DailyPlanTableProps {
  plans: DailyPlan[];
  costPerInstall: number;
  editable?: boolean;
  onUpdate?: (day: number, data: { actualInstalls?: number; cost?: number }) => Promise<void>;
}

export function DailyPlanTable({ plans, costPerInstall, editable = false, onUpdate }: DailyPlanTableProps) {
  const [editingDay, setEditingDay] = React.useState<number | null>(null);
  const [editValues, setEditValues] = React.useState({ actualInstalls: 0, cost: 0 });

  const startEdit = (plan: DailyPlan) => {
    setEditingDay(plan.day);
    setEditValues({ actualInstalls: plan.actualInstalls, cost: plan.cost });
  };

  const cancelEdit = () => setEditingDay(null);

  const saveEdit = async (day: number) => {
    if (onUpdate) {
      await onUpdate(day, editValues);
    }
    setEditingDay(null);
  };

  const totalPlanned = plans.reduce((s, p) => s + p.plannedInstalls, 0);
  const totalActual = plans.reduce((s, p) => s + p.actualInstalls, 0);
  const totalCost = plans.reduce((s, p) => s + p.cost, 0);

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-14">Day</TableHead>
            <TableHead className="w-28">Date</TableHead>
            <TableHead className="text-right w-28">Planned</TableHead>
            <TableHead className="text-right w-28">Actual</TableHead>
            <TableHead className="text-right w-24">Cost</TableHead>
            <TableHead className="w-28">Status</TableHead>
            {editable && <TableHead className="w-20" />}
          </TableRow>
        </TableHeader>
        <TableBody>
          {plans.map((plan) => {
            const isEditing = editingDay === plan.day;
            const deviation = plan.actualInstalls > 0
              ? ((plan.actualInstalls - plan.plannedInstalls) / plan.plannedInstalls * 100)
              : 0;

            return (
              <TableRow key={plan.day}>
                <TableCell className="font-medium">{plan.day}</TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {new Date(plan.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </TableCell>
                <TableCell className="text-right">{plan.plannedInstalls}</TableCell>
                <TableCell className="text-right">
                  {isEditing ? (
                    <Input
                      type="number"
                      value={editValues.actualInstalls}
                      onChange={(e) => setEditValues((v) => ({ ...v, actualInstalls: +e.target.value }))}
                      className="h-7 w-20 text-right ml-auto"
                    />
                  ) : (
                    <span className={cn(
                      plan.actualInstalls > 0 && Math.abs(deviation) > 20 && "font-medium",
                      deviation > 20 && "text-amber-600",
                      deviation < -20 && "text-red-600"
                    )}>
                      {plan.actualInstalls || "—"}
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {isEditing ? (
                    <Input
                      type="number"
                      step="0.01"
                      value={editValues.cost}
                      onChange={(e) => setEditValues((v) => ({ ...v, cost: +e.target.value }))}
                      className="h-7 w-20 text-right ml-auto"
                    />
                  ) : (
                    plan.cost > 0 ? `$${plan.cost.toFixed(2)}` : `$${(plan.plannedInstalls * costPerInstall).toFixed(2)}`
                  )}
                </TableCell>
                <TableCell>
                  <StatusBadge status={plan.status} size="sm" />
                </TableCell>
                {editable && (
                  <TableCell>
                    {isEditing ? (
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon-xs" onClick={() => saveEdit(plan.day)}>
                          <Check className="size-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon-xs" onClick={cancelEdit}>
                          <X className="size-3.5" />
                        </Button>
                      </div>
                    ) : (
                      <Button variant="ghost" size="icon-xs" onClick={() => startEdit(plan)}>
                        <Pencil className="size-3.5" />
                      </Button>
                    )}
                  </TableCell>
                )}
              </TableRow>
            );
          })}

          <TableRow className="font-medium bg-muted/50">
            <TableCell colSpan={2}>Total</TableCell>
            <TableCell className="text-right">{totalPlanned}</TableCell>
            <TableCell className="text-right">{totalActual || "—"}</TableCell>
            <TableCell className="text-right">
              {totalCost > 0 ? `$${totalCost.toFixed(2)}` : `$${(totalPlanned * costPerInstall).toFixed(2)}`}
            </TableCell>
            <TableCell />
            {editable && <TableCell />}
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}
