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
    const months = parseInt(searchParams.get("months") ?? "12", 10);

    const since = new Date();
    since.setMonth(since.getMonth() - months);

    const dailyPlans = await prisma.pushDailyPlan.findMany({
      where: {
        date: { gte: since },
        status: { in: ["COMPLETED", "IN_PROGRESS", "SENT"] },
      },
      select: {
        date: true,
        cost: true,
        actualInstalls: true,
      },
      orderBy: { date: "asc" },
    });

    const monthlyMap = new Map<
      string,
      { spend: number; installs: number }
    >();

    for (const plan of dailyPlans) {
      const key = `${plan.date.getFullYear()}-${String(plan.date.getMonth() + 1).padStart(2, "0")}`;
      const entry = monthlyMap.get(key) ?? { spend: 0, installs: 0 };
      entry.spend += plan.cost;
      entry.installs += plan.actualInstalls;
      monthlyMap.set(key, entry);
    }

    const monthly = Array.from(monthlyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({
        month,
        spend: Math.round(data.spend * 100) / 100,
        installs: data.installs,
      }));

    const totalSpend = monthly.reduce((sum, m) => sum + m.spend, 0);
    const totalInstalls = monthly.reduce((sum, m) => sum + m.installs, 0);

    return apiSuccess({
      monthly,
      totalSpend: Math.round(totalSpend * 100) / 100,
      totalInstalls,
      avgCPI:
        totalInstalls > 0
          ? Math.round((totalSpend / totalInstalls) * 100) / 100
          : 0,
      currency: "USD",
    });
  } catch (err) {
    console.error("Analytics spend error:", err);
    return apiError("INTERNAL_ERROR", "Failed to load spend data", 500);
  }
}
