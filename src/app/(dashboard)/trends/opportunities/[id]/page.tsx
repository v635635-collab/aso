"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OpportunityDetail } from "@/components/trends/opportunity-detail";
import { useApi, useApiMutation } from "@/hooks/use-api";

interface Opportunity {
  id: string;
  status: string;
  trendQuery: string;
  trendCategory: string;
  geo: string;
  interestScore: number;
  changePercent: number;
  isBreakout: boolean;
  suggestedNiche: string | null;
  suggestedKeywords: unknown;
  appStoreGap: number | null;
  estimatedTraffic: number | null;
  competitionLevel: string | null;
  aiAnalysis: string | null;
  aiRecommendation: string | null;
  confidenceScore: number | null;
  matchedKeywordIds: string[];
  notes: string | null;
  analyzedAt: string | null;
  createdAt: string;
}

export default function OpportunityDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const {
    data: opportunity,
    loading,
    error,
    mutate,
  } = useApi<Opportunity>(params.id ? `/api/trends/opportunities/${params.id}` : null);

  const { trigger: updateStatus, loading: statusLoading } = useApiMutation<
    { status: string },
    Opportunity
  >(`/api/trends/opportunities/${params.id}`, "PATCH");

  const handleStatusChange = async (status: string) => {
    await updateStatus({ status });
    mutate();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !opportunity) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => router.push("/trends")}>
          <ArrowLeft className="mr-2 size-4" />
          Back to Trends
        </Button>
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <p className="text-lg font-semibold">Opportunity not found</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {error?.message ?? "The requested trend opportunity could not be loaded."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" onClick={() => router.push("/trends")}>
        <ArrowLeft className="mr-2 size-4" />
        Back to Trends
      </Button>

      <OpportunityDetail
        opportunity={opportunity}
        onStatusChange={handleStatusChange}
        statusLoading={statusLoading}
      />
    </div>
  );
}
