import prisma from '@/lib/prisma';
import { withCronWrapper } from '../wrapper';

export async function nicheRecalculateJob(): Promise<void> {
  await withCronWrapper('niche-recalculate', async () => {
    const niches = await prisma.niche.findMany({
      select: { id: true },
    });

    let processed = 0;

    for (const niche of niches) {
      try {
        const keywordAgg = await prisma.keyword.aggregate({
          where: { nicheId: niche.id },
          _sum: { trafficScore: true },
          _avg: { sap: true, competition: true },
          _count: true,
        });

        const appCount = await prisma.app.count({
          where: { nicheId: niche.id },
        });

        await prisma.niche.update({
          where: { id: niche.id },
          data: {
            totalTraffic: keywordAgg._sum.trafficScore ?? 0,
            avgSAP: keywordAgg._avg.sap ?? 0,
            avgCompetition: keywordAgg._avg.competition ?? 0,
            keywordCount: keywordAgg._count,
            appCount,
          },
        });

        processed++;
      } catch (error) {
        console.error(`[CRON] niche-recalculate: failed for niche=${niche.id}:`, error);
      }
    }

    return { itemsProcessed: processed, metadata: { totalNiches: niches.length } };
  });
}
