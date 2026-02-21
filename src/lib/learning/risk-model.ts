import prisma from '@/lib/prisma';

interface NicheStats {
  campaigns: number;
  successRate: number;
  avgDailyInstalls: number;
  avgPessimizationDay: number | null;
}

interface RiskModelResult {
  overallStats: {
    total: number;
    successful: number;
    pessimized: number;
    averageCPI: number;
  };
  nicheStats: Record<string, NicheStats>;
  recommendations: string[];
}

export async function getRiskModel(): Promise<RiskModelResult> {
  const records = await prisma.pushLearningRecord.findMany({
    orderBy: { createdAt: 'desc' },
  });

  const total = records.length;
  const successful = records.filter((r) => r.outcome === 'SUCCESS' || r.outcome === 'PARTIAL').length;
  const pessimized = records.filter((r) => r.pessimized).length;

  const campaigns = await prisma.pushCampaign.findMany({
    where: { status: { in: ['COMPLETED', 'CANCELLED', 'PESSIMIZED'] } },
    select: { spentBudget: true, completedInstalls: true },
  });

  const totalSpent = campaigns.reduce((s, c) => s + c.spentBudget, 0);
  const totalInstalls = campaigns.reduce((s, c) => s + c.completedInstalls, 0);
  const averageCPI = totalInstalls > 0 ? totalSpent / totalInstalls : 0;

  const nicheGroups: Record<string, typeof records> = {};
  for (const r of records) {
    (nicheGroups[r.nicheSlug] ??= []).push(r);
  }

  const nicheStats: Record<string, NicheStats> = {};
  for (const [niche, recs] of Object.entries(nicheGroups)) {
    const count = recs.length;
    const successes = recs.filter((r) => r.outcome === 'SUCCESS' || r.outcome === 'PARTIAL').length;
    const avgDaily = Math.round(recs.reduce((s, r) => s + r.dailyInstalls, 0) / count);

    const pessimizedRecs = recs.filter((r) => r.pessimizationDay !== null);
    const avgPessDay = pessimizedRecs.length > 0
      ? Math.round(pessimizedRecs.reduce((s, r) => s + (r.pessimizationDay || 0), 0) / pessimizedRecs.length)
      : null;

    nicheStats[niche] = {
      campaigns: count,
      successRate: count > 0 ? successes / count : 0,
      avgDailyInstalls: avgDaily,
      avgPessimizationDay: avgPessDay,
    };
  }

  const recommendations = generateRecommendations(total, successful, pessimized, nicheStats);

  return {
    overallStats: { total, successful, pessimized, averageCPI: +averageCPI.toFixed(3) },
    nicheStats,
    recommendations,
  };
}

function generateRecommendations(
  total: number,
  successful: number,
  pessimized: number,
  nicheStats: Record<string, NicheStats>
): string[] {
  const recs: string[] = [];

  if (total === 0) {
    return ['No campaign data yet. Start running campaigns to build the risk model.'];
  }

  const successRate = successful / total;
  const pessRate = pessimized / total;

  if (successRate < 0.5) {
    recs.push(`Overall success rate is low (${(successRate * 100).toFixed(0)}%). Consider using more conservative strategies.`);
  } else {
    recs.push(`Overall success rate is ${(successRate * 100).toFixed(0)}% — performing well.`);
  }

  if (pessRate > 0.2) {
    recs.push(`Pessimization rate is concerning (${(pessRate * 100).toFixed(0)}%). Review install volumes and ramp-up speeds.`);
  }

  const dangerousNiches = Object.entries(nicheStats)
    .filter(([, s]) => s.campaigns >= 3 && s.successRate < 0.4)
    .map(([n]) => n);

  if (dangerousNiches.length > 0) {
    recs.push(`High-risk niches with low success rates: ${dangerousNiches.join(', ')}. Use CONSERVATIVE strategy in these niches.`);
  }

  const safeNiches = Object.entries(nicheStats)
    .filter(([, s]) => s.campaigns >= 3 && s.successRate > 0.7)
    .map(([n]) => n);

  if (safeNiches.length > 0) {
    recs.push(`Safe niches with high success rates: ${safeNiches.join(', ')}. Can use GRADUAL or AGGRESSIVE strategies.`);
  }

  const earlyPessNiches = Object.entries(nicheStats)
    .filter(([, s]) => s.avgPessimizationDay !== null && s.avgPessimizationDay <= 5);

  if (earlyPessNiches.length > 0) {
    recs.push(
      `Niches with early pessimization (avg day <=5): ${earlyPessNiches.map(([n]) => n).join(', ')}. Extend ramp-up period in these niches.`
    );
  }

  return recs;
}
