import prisma from '@/lib/prisma';
import { withCronWrapper } from '../wrapper';
import { getSetting } from '@/lib/settings/service';
import googleTrends from 'google-trends-api';

const RATE_LIMIT_MS = 3_000;

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export async function trendsCollectorJob(): Promise<void> {
  await withCronWrapper('trends-collector', async () => {
    const seedQueries = ((await getSetting('trends.seedQueries')) as string[] | null) ?? [];
    const geos = ((await getSetting('trends.geos')) as string[] | null) ?? ['', 'US', 'RU'];

    if (seedQueries.length === 0) {
      return { itemsProcessed: 0, metadata: { message: 'No seed queries configured' } };
    }

    let collected = 0;

    for (const query of seedQueries) {
      for (const geo of geos) {
        try {
          const rawResult = await googleTrends.interestOverTime({
            keyword: query,
            geo: geo || undefined,
            startTime: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
          });

          const parsed = JSON.parse(rawResult);
          const timelineData = parsed?.default?.timelineData ?? [];

          if (timelineData.length === 0) {
            await sleep(RATE_LIMIT_MS);
            continue;
          }

          const recent = timelineData.slice(-4);
          const older = timelineData.slice(-8, -4);

          const currentInterest = recent.length > 0
            ? Math.round(
                recent.reduce((sum: number, d: { value: number[] }) => sum + (d.value?.[0] ?? 0), 0) /
                  recent.length,
              )
            : 0;

          const prevInterest = older.length > 0
            ? Math.round(
                older.reduce((sum: number, d: { value: number[] }) => sum + (d.value?.[0] ?? 0), 0) /
                  older.length,
              )
            : null;

          const changePercent =
            prevInterest != null && prevInterest > 0
              ? ((currentInterest - prevInterest) / prevInterest) * 100
              : null;

          const peak = Math.max(
            ...timelineData.map((d: { value: number[] }) => d.value?.[0] ?? 0),
          );
          const isBreakout = currentInterest >= peak * 0.9 && peak > 50;

          await prisma.trendSnapshot.create({
            data: {
              query,
              category: 'app-store',
              geo,
              timeRange: 'today 3-m',
              interestCurrent: currentInterest,
              interestPrev: prevInterest,
              changePercent,
              isBreakout,
              peakInterest: peak,
              relatedQueries: (parsed?.default?.relatedQueries ?? []) as import('@prisma/client').Prisma.InputJsonValue,
              relatedTopics: (parsed?.default?.relatedTopics ?? []) as import('@prisma/client').Prisma.InputJsonValue,
            },
          });

          collected++;
          await sleep(RATE_LIMIT_MS);
        } catch (error) {
          console.error(
            `[CRON] trends-collector: failed for query="${query}" geo="${geo}":`,
            error,
          );
          await sleep(RATE_LIMIT_MS);
        }
      }
    }

    return {
      itemsProcessed: collected,
      metadata: { queries: seedQueries.length, geos: geos.length },
    };
  });
}
