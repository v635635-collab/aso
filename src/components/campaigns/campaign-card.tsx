"use client";

import { Calendar, Target, DollarSign, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { cn } from "@/lib/utils";

interface CampaignCardProps {
  campaign: {
    id: string;
    name: string;
    status: string;
    strategy: string;
    totalBudget: number;
    spentBudget: number;
    totalInstalls: number;
    completedInstalls: number;
    durationDays: number;
    startDate: string | null;
    endDate: string | null;
    targetKeywords: string[];
    app?: { name: string; iconUrl: string | null };
  };
  onClick?: () => void;
  className?: string;
}

export function CampaignCard({ campaign, onClick, className }: CampaignCardProps) {
  const progress = campaign.totalInstalls > 0
    ? Math.round((campaign.completedInstalls / campaign.totalInstalls) * 100)
    : 0;

  const budgetUsed = campaign.totalBudget > 0
    ? Math.round((campaign.spentBudget / campaign.totalBudget) * 100)
    : 0;

  return (
    <Card
      className={cn("transition-all hover:shadow-md", onClick && "cursor-pointer", className)}
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-start justify-between pb-3">
        <div className="space-y-1 min-w-0 flex-1">
          <CardTitle className="text-base truncate">{campaign.name}</CardTitle>
          {campaign.app && (
            <p className="text-xs text-muted-foreground truncate">{campaign.app.name}</p>
          )}
        </div>
        <StatusBadge status={campaign.status} />
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Target className="size-3.5" />
            <span>{campaign.strategy}</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Calendar className="size-3.5" />
            <span>{campaign.durationDays}d</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <DollarSign className="size-3.5" />
            <span>${campaign.totalBudget.toFixed(0)}</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <TrendingUp className="size-3.5" />
            <span>{campaign.completedInstalls}/{campaign.totalInstalls}</span>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Installs</span>
            <span>{progress}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${Math.min(100, progress)}%` }}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Budget</span>
            <span>{budgetUsed}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                budgetUsed > 90 ? "bg-red-500" : budgetUsed > 70 ? "bg-amber-500" : "bg-emerald-500"
              )}
              style={{ width: `${Math.min(100, budgetUsed)}%` }}
            />
          </div>
        </div>

        {campaign.targetKeywords.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {campaign.targetKeywords.slice(0, 3).map((kw) => (
              <span key={kw} className="inline-flex items-center rounded-md bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                {kw}
              </span>
            ))}
            {campaign.targetKeywords.length > 3 && (
              <span className="text-[10px] text-muted-foreground">+{campaign.targetKeywords.length - 3}</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
