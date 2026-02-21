import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/utils";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return apiError("UNAUTHORIZED", "Authentication required", 401);
    }

    const { searchParams } = new URL(request.url);
    const limitParam = parseInt(searchParams.get("limit") ?? "20", 10);
    const take = Math.min(50, Math.max(1, limitParam));

    const keywords = await prisma.keyword.findMany({
      where: {
        trafficScore: { not: null },
      },
      orderBy: { trafficScore: "desc" },
      take,
      select: {
        id: true,
        text: true,
        trafficScore: true,
        sap: true,
        competition: true,
        difficulty: true,
        appKeywords: {
          select: {
            currentPosition: true,
            bestPosition: true,
            positionTrend: true,
            app: { select: { name: true } },
          },
          take: 3,
          orderBy: { currentPosition: "asc" },
        },
      },
    });

    const rows = keywords.map((kw) => {
      const bestTracking = kw.appKeywords[0];
      return {
        id: kw.id,
        text: kw.text,
        trafficScore: kw.trafficScore ?? 0,
        sap: kw.sap ?? 0,
        competition: kw.competition ?? 0,
        difficulty: kw.difficulty ?? 0,
        position: bestTracking?.currentPosition ?? null,
        bestPosition: bestTracking?.bestPosition ?? null,
        trend: bestTracking?.positionTrend ?? "STABLE",
        trackedApps: kw.appKeywords.length,
        appName: bestTracking?.app?.name ?? null,
      };
    });

    const summary = {
      totalTracked: rows.length,
      improved: rows.filter((r) => r.trend === "RISING").length,
      declined: rows.filter((r) => r.trend === "FALLING").length,
      unchanged: rows.filter((r) => r.trend === "STABLE").length,
      newEntries: rows.filter((r) => r.trend === "NEW").length,
    };

    return apiSuccess({ keywords: rows, summary });
  } catch (err) {
    console.error("Analytics keyword performance error:", err);
    return apiError(
      "INTERNAL_ERROR",
      "Failed to load keyword performance data",
      500
    );
  }
}
