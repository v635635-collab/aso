import prisma from '@/lib/prisma';
import type { PushLearningRecord } from '@prisma/client';

export async function buildLearningRecord(campaignId: string): Promise<PushLearningRecord> {
  const campaign = await prisma.pushCampaign.findUnique({
    where: { id: campaignId },
    include: {
      app: {
        select: {
          organicDownloads: true,
          categoryRank: true,
          createdAt: true,
          niche: { select: { name: true } },
        },
      },
      dailyPlans: { orderBy: { day: 'asc' } },
      pessimizations: { orderBy: { detectedAt: 'desc' }, take: 1 },
    },
  });

  if (!campaign) throw new Error(`Campaign ${campaignId} not found`);

  const nicheSlug = campaign.app.niche?.name || 'unknown';
  const appAge = Math.floor(
    (Date.now() - new Date(campaign.app.createdAt).getTime()) / 86400000
  );

  const completedPlans = campaign.dailyPlans.filter((dp) => dp.actualInstalls > 0);
  const totalActualInstalls = completedPlans.reduce((s, dp) => s + dp.actualInstalls, 0);
  const maxDaily = Math.max(0, ...completedPlans.map((dp) => dp.actualInstalls));
  const avgDaily = completedPlans.length > 0 ? totalActualInstalls / completedPlans.length : 0;

  const rampProfile = campaign.dailyPlans.map((dp) => ({
    day: dp.day,
    planned: dp.plannedInstalls,
    actual: dp.actualInstalls,
  }));

  let rampUpDays = 0;
  const peakInstalls = maxDaily;
  for (const dp of campaign.dailyPlans) {
    if (dp.actualInstalls >= peakInstalls * 0.8) break;
    rampUpDays++;
  }

  const velocity = campaign.durationDays > 0 ? totalActualInstalls / campaign.durationDays : 0;

  const pessEvent = campaign.pessimizations[0] ?? null;
  const pessimized = !!pessEvent;
  let pessimizationDay: number | null = null;
  if (pessEvent && campaign.startDate) {
    pessimizationDay = Math.ceil(
      (new Date(pessEvent.detectedAt).getTime() - new Date(campaign.startDate).getTime()) / 86400000
    );
  }

  const kwData = await prisma.appKeyword.findMany({
    where: {
      appId: campaign.appId,
      keyword: { text: { in: campaign.targetKeywords } },
    },
    include: { keyword: { select: { difficulty: true, trafficScore: true } } },
  });

  const avgDifficulty = kwData.length > 0
    ? kwData.reduce((s, k) => s + (k.keyword.difficulty || 0), 0) / kwData.length
    : null;
  const avgTraffic = kwData.length > 0
    ? Math.round(kwData.reduce((s, k) => s + (k.keyword.trafficScore || 0), 0) / kwData.length)
    : null;

  const finalPositions = kwData.map((k) => k.currentPosition).filter((p): p is number => p !== null);
  const startPositions = kwData.map((k) => k.worstPosition).filter((p): p is number => p !== null);
  const avgFinalPos = finalPositions.length > 0
    ? Math.round(finalPositions.reduce((a, b) => a + b, 0) / finalPositions.length)
    : null;
  const avgStartPos = startPositions.length > 0
    ? Math.round(startPositions.reduce((a, b) => a + b, 0) / startPositions.length)
    : null;

  const positionGain = avgStartPos !== null && avgFinalPos !== null ? avgStartPos - avgFinalPos : null;

  let outcome: 'SUCCESS' | 'PARTIAL' | 'FAILED' | 'PESSIMIZED' | 'UNKNOWN';
  if (pessimized) {
    outcome = 'PESSIMIZED';
  } else if (positionGain !== null && positionGain > 5) {
    outcome = 'SUCCESS';
  } else if (positionGain !== null && positionGain > 0) {
    outcome = 'PARTIAL';
  } else if (positionGain !== null) {
    outcome = 'FAILED';
  } else {
    outcome = 'UNKNOWN';
  }

  return prisma.pushLearningRecord.create({
    data: {
      nicheSlug,
      appAge,
      organicDownloads: campaign.app.organicDownloads,
      categoryRank: campaign.app.categoryRank,
      keywordDifficulty: avgDifficulty,
      keywordTraffic: avgTraffic,
      startPosition: avgStartPos,
      pushStrategy: campaign.strategy,
      dailyInstalls: Math.round(avgDaily),
      totalInstalls: totalActualInstalls || campaign.totalInstalls,
      durationDays: campaign.durationDays,
      rampProfile: rampProfile as unknown as import('@prisma/client').Prisma.InputJsonValue,
      installVelocity: velocity,
      maxDailyInstalls: maxDaily,
      rampUpDays,
      outcome,
      finalPosition: avgFinalPos,
      positionGain,
      pessimized,
      pessimizationDay,
      pessimizationId: pessEvent?.id ?? null,
    },
  });
}
