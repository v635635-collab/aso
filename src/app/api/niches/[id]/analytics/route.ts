import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/utils';
import { getCurrentUser } from '@/lib/auth';

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) return apiError('UNAUTHORIZED', 'Unauthorized', 401);

    const { id } = await params;

    const niche = await prisma.niche.findUnique({
      where: { id },
      include: {
        keywords: {
          select: {
            id: true,
            trafficScore: true,
            sap: true,
            competition: true,
            difficulty: true,
            intent: true,
          },
        },
      },
    });

    if (!niche) return apiError('NOT_FOUND', 'Niche not found', 404);

    const keywords = niche.keywords;
    const totalTraffic = keywords.reduce((sum, k) => sum + (k.trafficScore ?? 0), 0);
    const avgSap = keywords.length
      ? keywords.reduce((sum, k) => sum + (k.sap ?? 0), 0) / keywords.length
      : 0;
    const avgCompetition = keywords.length
      ? keywords.reduce((sum, k) => sum + (k.competition ?? 0), 0) / keywords.length
      : 0;
    const avgDifficulty = keywords.length
      ? keywords.reduce((sum, k) => sum + (k.difficulty ?? 0), 0) / keywords.length
      : 0;

    const intentDistribution: Record<string, number> = {};
    for (const k of keywords) {
      const intent = k.intent ?? 'UNKNOWN';
      intentDistribution[intent] = (intentDistribution[intent] || 0) + 1;
    }

    const trafficBuckets = { low: 0, medium: 0, high: 0 };
    for (const k of keywords) {
      const ts = k.trafficScore ?? 0;
      if (ts > 50) trafficBuckets.high++;
      else if (ts >= 20) trafficBuckets.medium++;
      else trafficBuckets.low++;
    }

    await prisma.niche.update({
      where: { id },
      data: {
        totalTraffic,
        avgSAP: Math.round(avgSap * 100) / 100,
        avgCompetition: Math.round(avgCompetition * 100) / 100,
        keywordCount: keywords.length,
      },
    });

    return apiSuccess({
      nicheId: id,
      totalKeywords: keywords.length,
      totalTraffic,
      avgSap: Math.round(avgSap * 100) / 100,
      avgCompetition: Math.round(avgCompetition * 100) / 100,
      avgDifficulty: Math.round(avgDifficulty * 100) / 100,
      intentDistribution,
      trafficDistribution: trafficBuckets,
    });
  } catch {
    return apiError('INTERNAL_ERROR', 'Failed to fetch analytics', 500);
  }
}
