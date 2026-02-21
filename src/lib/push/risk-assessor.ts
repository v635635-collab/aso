import prisma from '@/lib/prisma';
import type { PushStrategy } from '@prisma/client';

type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

interface RiskAssessmentResult {
  riskLevel: RiskLevel;
  riskScore: number;
  reasons: string[];
  recommendation: string;
}

const STRATEGY_RISK_WEIGHT: Record<PushStrategy, number> = {
  CONSERVATIVE: 0,
  GRADUAL: 10,
  AGGRESSIVE: 30,
  CUSTOM: 15,
};

export async function assessRisk(params: {
  nicheSlug: string;
  keywordDifficulty: number;
  dailyInstalls: number;
  strategy: PushStrategy;
}): Promise<RiskAssessmentResult> {
  const records = await prisma.pushLearningRecord.findMany({
    where: { nicheSlug: params.nicheSlug },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  const reasons: string[] = [];
  let score = 0;

  score += STRATEGY_RISK_WEIGHT[params.strategy];
  if (params.strategy === 'AGGRESSIVE') {
    reasons.push('Aggressive strategy increases pessimization risk');
  }

  if (params.keywordDifficulty > 70) {
    score += 25;
    reasons.push(`High keyword difficulty (${params.keywordDifficulty.toFixed(0)})`);
  } else if (params.keywordDifficulty > 40) {
    score += 10;
    reasons.push(`Moderate keyword difficulty (${params.keywordDifficulty.toFixed(0)})`);
  }

  if (params.dailyInstalls > 200) {
    score += 20;
    reasons.push(`High daily install volume (${params.dailyInstalls})`);
  } else if (params.dailyInstalls > 100) {
    score += 10;
    reasons.push(`Moderate daily install volume (${params.dailyInstalls})`);
  }

  if (records.length > 0) {
    const pessimized = records.filter((r) => r.pessimized);
    const pessRate = pessimized.length / records.length;

    if (pessRate > 0.3) {
      score += 25;
      reasons.push(`Niche has high pessimization rate (${(pessRate * 100).toFixed(0)}%)`);
    } else if (pessRate > 0.1) {
      score += 10;
      reasons.push(`Niche has moderate pessimization rate (${(pessRate * 100).toFixed(0)}%)`);
    }

    const similarRecords = records.filter(
      (r) => r.dailyInstalls >= params.dailyInstalls * 0.7 && r.dailyInstalls <= params.dailyInstalls * 1.3
    );
    const similarPessimized = similarRecords.filter((r) => r.pessimized);
    if (similarRecords.length >= 3 && similarPessimized.length / similarRecords.length > 0.4) {
      score += 15;
      reasons.push('Similar install volumes have led to pessimization in this niche');
    }

    const recentPessimizations = pessimized.filter(
      (r) => Date.now() - new Date(r.createdAt).getTime() < 30 * 86400000
    );
    if (recentPessimizations.length > 0) {
      score += 10;
      reasons.push(`${recentPessimizations.length} recent pessimization(s) in last 30 days`);
    }
  } else {
    score += 5;
    reasons.push('No prior data for this niche — proceed with caution');
  }

  score = Math.min(100, Math.max(0, score));

  let riskLevel: RiskLevel;
  if (score >= 75) riskLevel = 'CRITICAL';
  else if (score >= 50) riskLevel = 'HIGH';
  else if (score >= 25) riskLevel = 'MEDIUM';
  else riskLevel = 'LOW';

  let recommendation: string;
  switch (riskLevel) {
    case 'CRITICAL':
      recommendation = 'Strongly recommend reducing daily installs or switching to CONSERVATIVE strategy. Consider running a small test campaign first.';
      break;
    case 'HIGH':
      recommendation = 'Consider reducing install volume or extending the ramp-up period. Monitor positions closely after day 3.';
      break;
    case 'MEDIUM':
      recommendation = 'Plan looks reasonable but monitor positions daily. Have a pause plan ready if positions drop.';
      break;
    default:
      recommendation = 'Low risk. Proceed with the plan but maintain standard monitoring.';
  }

  return { riskLevel, riskScore: score, reasons, recommendation };
}
