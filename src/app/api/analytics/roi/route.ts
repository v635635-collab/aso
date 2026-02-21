import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/utils";
import { getCurrentUser } from "@/lib/auth";

export async function GET(_request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return apiError("UNAUTHORIZED", "Authentication required", 401);
    }

    const campaigns = await prisma.pushCampaign.findMany({
      where: {
        status: { in: ["COMPLETED", "ACTIVE", "PAUSED"] },
      },
      select: {
        id: true,
        name: true,
        status: true,
        spentBudget: true,
        totalInstalls: true,
        completedInstalls: true,
        costPerInstall: true,
        roiEstimate: true,
        app: {
          select: { name: true },
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 50,
    });

    const rows = campaigns.map((c) => {
      const spend = c.spentBudget;
      const installs = c.completedInstalls || c.totalInstalls;
      const cpi = installs > 0 ? spend / installs : 0;

      return {
        id: c.id,
        campaignName: c.name,
        appName: c.app.name,
        status: c.status,
        spend: Math.round(spend * 100) / 100,
        installs,
        cpi: Math.round(cpi * 100) / 100,
        roiEstimate: c.roiEstimate ?? null,
      };
    });

    const totalSpend = rows.reduce((s, r) => s + r.spend, 0);
    const totalInstalls = rows.reduce((s, r) => s + r.installs, 0);
    const averageROI =
      rows.filter((r) => r.roiEstimate !== null).length > 0
        ? rows.reduce((s, r) => s + (r.roiEstimate ?? 0), 0) /
          rows.filter((r) => r.roiEstimate !== null).length
        : 0;

    return apiSuccess({
      campaigns: rows,
      totalSpend: Math.round(totalSpend * 100) / 100,
      totalInstalls,
      averageROI: Math.round(averageROI * 100) / 100,
      bestCampaign:
        rows.length > 0
          ? rows.reduce((best, r) =>
              (r.roiEstimate ?? 0) > (best.roiEstimate ?? 0) ? r : best
            )
          : null,
    });
  } catch (err) {
    console.error("Analytics ROI error:", err);
    return apiError("INTERNAL_ERROR", "Failed to load ROI data", 500);
  }
}
