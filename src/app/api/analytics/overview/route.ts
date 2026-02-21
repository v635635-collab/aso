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

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const [
      totalApps,
      totalKeywords,
      activeCampaigns,
      pendingAlerts,
      recentNotifications,
      positionChanges,
      campaigns,
      trendOpportunities,
      prevWeekApps,
      prevWeekKeywords,
    ] = await Promise.all([
      prisma.app.count(),
      prisma.keyword.count(),
      prisma.pushCampaign.count({ where: { status: "ACTIVE" } }),
      prisma.notification.count({
        where: { userId: user.id, isRead: false },
      }),
      prisma.notification.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: { type: true, title: true, body: true, createdAt: true },
      }),
      prisma.positionSnapshot.findMany({
        where: {
          capturedAt: { gte: yesterday },
          change: { not: null },
        },
        orderBy: { capturedAt: "desc" },
        take: 100,
        select: {
          change: true,
          position: true,
          previousPosition: true,
          app: { select: { name: true } },
          keyword: { select: { text: true } },
        },
      }),
      prisma.pushCampaign.findMany({
        where: { status: { in: ["ACTIVE", "APPROVED", "REVIEW"] } },
        select: {
          id: true,
          name: true,
          status: true,
          totalInstalls: true,
          completedInstalls: true,
          totalBudget: true,
          spentBudget: true,
          durationDays: true,
          startDate: true,
          app: { select: { name: true } },
        },
        orderBy: { updatedAt: "desc" },
        take: 10,
      }),
      prisma.trendOpportunity.findMany({
        where: {
          status: { in: ["NEW", "REVIEWING", "ACTIONABLE"] },
        },
        orderBy: { changePercent: "desc" },
        take: 3,
        select: {
          id: true,
          trendQuery: true,
          trendCategory: true,
          interestScore: true,
          changePercent: true,
          isBreakout: true,
          suggestedNiche: true,
          competitionLevel: true,
          estimatedTraffic: true,
        },
      }),
      prisma.app.count({
        where: { createdAt: { lt: new Date(Date.now() - 7 * 86400000) } },
      }),
      prisma.keyword.count({
        where: { createdAt: { lt: new Date(Date.now() - 7 * 86400000) } },
      }),
    ]);

    const recentActivity = recentNotifications.map((n) => ({
      type: n.type,
      message: n.title,
      createdAt: n.createdAt.toISOString(),
    }));

    const sorted = positionChanges
      .filter((p) => p.change !== null)
      .sort((a, b) => Math.abs(b.change!) - Math.abs(a.change!))
      .slice(0, 5)
      .map((p) => ({
        appName: p.app.name,
        keyword: p.keyword.text,
        change: p.change!,
        position: p.position,
        previousPosition: p.previousPosition,
      }));

    const campaignProgress = campaigns.map((c) => {
      const installProgress =
        c.totalInstalls > 0
          ? Math.round((c.completedInstalls / c.totalInstalls) * 100)
          : 0;
      const budgetProgress =
        c.totalBudget > 0
          ? Math.round((c.spentBudget / c.totalBudget) * 100)
          : 0;
      let daysProgress = 0;
      if (c.startDate && c.durationDays > 0) {
        const elapsed = Math.floor(
          (Date.now() - c.startDate.getTime()) / 86400000
        );
        daysProgress = Math.min(
          100,
          Math.round((elapsed / c.durationDays) * 100)
        );
      }

      return {
        id: c.id,
        name: c.name,
        appName: c.app.name,
        status: c.status,
        installProgress,
        budgetProgress,
        daysProgress,
        completedInstalls: c.completedInstalls,
        totalInstalls: c.totalInstalls,
      };
    });

    return apiSuccess({
      totalApps,
      totalKeywords,
      activeCampaigns,
      pendingAlerts,
      recentActivity,
      positionChanges: sorted,
      campaignProgress,
      trendOpportunities,
      trends: {
        appsDelta: totalApps - prevWeekApps,
        keywordsDelta: totalKeywords - prevWeekKeywords,
      },
    });
  } catch (err) {
    console.error("Analytics overview error:", err);
    return apiError("INTERNAL_ERROR", "Failed to load overview data", 500);
  }
}
