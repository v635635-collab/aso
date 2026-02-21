import prisma from '@/lib/prisma';
import { withCronWrapper } from '../wrapper';
import { chatCompletion } from '@/lib/ai/openrouter';

export async function learningUpdateJob(): Promise<void> {
  await withCronWrapper('learning-update', async () => {
    const completedCampaigns = await prisma.pushCampaign.findMany({
      where: {
        status: 'COMPLETED',
        NOT: {
          id: {
            in: (
              await prisma.pushLearningRecord.findMany({
                select: { metadata: true },
              })
            )
              .filter((r) => {
                const meta = r.metadata as Record<string, unknown>;
                return typeof meta?.campaignId === 'string';
              })
              .map((r) => (r.metadata as Record<string, string>).campaignId),
          },
        },
      },
      include: {
        app: {
          select: {
            id: true,
            organicDownloads: true,
            categoryRank: true,
            createdAt: true,
            niche: { select: { name: true } },
          },
        },
        dailyPlans: { orderBy: { day: 'asc' } },
        pessimizations: { select: { id: true, detectedAt: true } },
      },
    });

    let processed = 0;

    for (const campaign of completedCampaigns) {
      try {
        const appAgeDays = Math.floor(
          (Date.now() - campaign.app.createdAt.getTime()) / (1000 * 60 * 60 * 24),
        );

        const rampProfile = campaign.dailyPlans.map((dp) => ({
          day: dp.day,
          planned: dp.plannedInstalls,
          actual: dp.actualInstalls,
        }));

        const totalInstalls = campaign.dailyPlans.reduce(
          (sum, dp) => sum + dp.actualInstalls,
          0,
        );
        const maxDaily = Math.max(...campaign.dailyPlans.map((dp) => dp.actualInstalls), 0);
        const rampUpDays = campaign.dailyPlans.findIndex(
          (dp) => dp.actualInstalls >= maxDaily * 0.8,
        );

        const velocity =
          campaign.durationDays > 0 ? totalInstalls / campaign.durationDays : 0;

        const isPessimized = campaign.pessimizations.length > 0;
        const pessDay = isPessimized
          ? campaign.dailyPlans.findIndex((dp) => {
              const pessDate = campaign.pessimizations[0]?.detectedAt;
              return pessDate && dp.date >= pessDate;
            })
          : undefined;

        const lastPlan = campaign.dailyPlans[campaign.dailyPlans.length - 1];
        const positionsAfter = lastPlan?.positionsAfter as Record<string, number> | null;
        const firstPlan = campaign.dailyPlans[0];
        const positionsBefore = firstPlan?.positionsBefore as Record<string, number> | null;

        let startPos: number | undefined;
        let finalPos: number | undefined;
        if (positionsBefore) {
          const vals = Object.values(positionsBefore);
          if (vals.length > 0) startPos = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
        }
        if (positionsAfter) {
          const vals = Object.values(positionsAfter);
          if (vals.length > 0) finalPos = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
        }

        const positionGain =
          startPos != null && finalPos != null ? startPos - finalPos : undefined;

        let outcome: 'SUCCESS' | 'PARTIAL' | 'FAILED' | 'PESSIMIZED' | 'UNKNOWN' = 'UNKNOWN';
        if (isPessimized) outcome = 'PESSIMIZED';
        else if (positionGain != null && positionGain > 5) outcome = 'SUCCESS';
        else if (positionGain != null && positionGain > 0) outcome = 'PARTIAL';
        else if (positionGain != null && positionGain <= 0) outcome = 'FAILED';

        let lessonsLearned: string | undefined;
        try {
          const aiResult = await chatCompletion([
            {
              role: 'system',
              content:
                'You are an ASO push campaign analyst. Analyze the campaign data and extract key lessons learned. Be concise (2-3 sentences).',
            },
            {
              role: 'user',
              content: JSON.stringify({
                niche: campaign.app.niche?.name,
                strategy: campaign.strategy,
                durationDays: campaign.durationDays,
                totalInstalls,
                outcome,
                positionGain,
                isPessimized,
                rampProfile: rampProfile.slice(0, 7),
              }),
            },
          ]);

          const aiResponse = aiResult as { choices?: Array<{ message?: { content?: string } }> };
          lessonsLearned = aiResponse.choices?.[0]?.message?.content ?? undefined;
        } catch {
          console.error(`[CRON] learning-update: AI call failed for campaign=${campaign.id}`);
        }

        await prisma.pushLearningRecord.create({
          data: {
            nicheSlug: campaign.app.niche?.name ?? 'unknown',
            appAge: appAgeDays,
            organicDownloads: campaign.app.organicDownloads,
            categoryRank: campaign.app.categoryRank,
            pushStrategy: campaign.strategy,
            dailyInstalls: maxDaily,
            totalInstalls,
            durationDays: campaign.durationDays,
            rampProfile: rampProfile as unknown as import('@prisma/client').Prisma.InputJsonValue,
            installVelocity: velocity,
            maxDailyInstalls: maxDaily,
            rampUpDays: rampUpDays >= 0 ? rampUpDays : 0,
            outcome,
            finalPosition: finalPos,
            startPosition: startPos,
            positionGain,
            pessimized: isPessimized,
            pessimizationDay: pessDay != null && pessDay >= 0 ? pessDay : undefined,
            pessimizationId: campaign.pessimizations[0]?.id,
            lessonsLearned,
            metadata: { campaignId: campaign.id },
          },
        });

        processed++;
      } catch (error) {
        console.error(`[CRON] learning-update: failed for campaign=${campaign.id}:`, error);
      }
    }

    return {
      itemsProcessed: processed,
      metadata: { eligibleCampaigns: completedCampaigns.length },
    };
  });
}
