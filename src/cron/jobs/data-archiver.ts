import prisma from '@/lib/prisma';
import { withCronWrapper } from '../wrapper';

const SNAPSHOT_RETENTION_DAYS = 30;
const API_LOG_RETENTION_DAYS = 7;
const TREND_EXPIRY_DAYS = 30;

export async function dataArchiverJob(): Promise<void> {
  await withCronWrapper('data-archiver', async () => {
    const snapshotCutoff = new Date();
    snapshotCutoff.setDate(snapshotCutoff.getDate() - SNAPSHOT_RETENTION_DAYS);

    const apiLogCutoff = new Date();
    apiLogCutoff.setDate(apiLogCutoff.getDate() - API_LOG_RETENTION_DAYS);

    const trendCutoff = new Date();
    trendCutoff.setDate(trendCutoff.getDate() - TREND_EXPIRY_DAYS);

    let positionsAggregated = 0;
    let keywordMetricsAggregated = 0;
    let apiLogsDeleted = 0;
    let trendsExpired = 0;

    const oldPositions = await prisma.positionSnapshot.groupBy({
      by: ['appId', 'keywordId', 'country'],
      where: { capturedAt: { lt: snapshotCutoff } },
      _min: { position: true },
      _max: { position: true },
      _avg: { position: true },
      _count: true,
    });

    for (const group of oldPositions) {
      try {
        const lastSnapshot = await prisma.positionSnapshot.findFirst({
          where: {
            appId: group.appId,
            keywordId: group.keywordId,
            country: group.country,
            capturedAt: { lt: snapshotCutoff },
          },
          orderBy: { capturedAt: 'desc' },
          select: { position: true, change: true, capturedAt: true },
        });

        if (!lastSnapshot) continue;

        const date = new Date(lastSnapshot.capturedAt);
        date.setHours(0, 0, 0, 0);

        await prisma.$transaction(async (tx) => {
          await tx.positionDaily.upsert({
            where: {
              appId_keywordId_country_date: {
                appId: group.appId,
                keywordId: group.keywordId,
                country: group.country,
                date,
              },
            },
            create: {
              appId: group.appId,
              keywordId: group.keywordId,
              country: group.country,
              date,
              minPosition: group._min.position,
              maxPosition: group._max.position,
              avgPosition: group._avg.position,
              endPosition: lastSnapshot.position,
              checkCount: group._count,
              change: lastSnapshot.change,
            },
            update: {
              minPosition: group._min.position,
              maxPosition: group._max.position,
              avgPosition: group._avg.position,
              endPosition: lastSnapshot.position,
              checkCount: group._count,
              change: lastSnapshot.change,
            },
          });

          await tx.positionSnapshot.deleteMany({
            where: {
              appId: group.appId,
              keywordId: group.keywordId,
              country: group.country,
              capturedAt: { lt: snapshotCutoff },
            },
          });
        });

        positionsAggregated++;
      } catch (error) {
        console.error(
          `[CRON] data-archiver: position aggregation failed for app=${group.appId} kw=${group.keywordId}:`,
          error,
        );
      }
    }

    const oldKeywordMetrics = await prisma.keywordMetricSnapshot.groupBy({
      by: ['keywordId'],
      where: { capturedAt: { lt: snapshotCutoff } },
      _avg: { trafficScore: true, sap: true, competition: true },
      _count: true,
    });

    for (const group of oldKeywordMetrics) {
      try {
        const lastMetric = await prisma.keywordMetricSnapshot.findFirst({
          where: {
            keywordId: group.keywordId,
            capturedAt: { lt: snapshotCutoff },
          },
          orderBy: { capturedAt: 'desc' },
          select: { capturedAt: true },
        });

        if (!lastMetric) continue;

        const date = new Date(lastMetric.capturedAt);
        date.setHours(0, 0, 0, 0);

        await prisma.$transaction(async (tx) => {
          await tx.keywordMetricDaily.upsert({
            where: {
              keywordId_date: {
                keywordId: group.keywordId,
                date,
              },
            },
            create: {
              keywordId: group.keywordId,
              date,
              avgTrafficScore: group._avg.trafficScore,
              avgSap: group._avg.sap,
              avgCompetition: group._avg.competition,
              checkCount: group._count,
            },
            update: {
              avgTrafficScore: group._avg.trafficScore,
              avgSap: group._avg.sap,
              avgCompetition: group._avg.competition,
              checkCount: group._count,
            },
          });

          await tx.keywordMetricSnapshot.deleteMany({
            where: {
              keywordId: group.keywordId,
              capturedAt: { lt: snapshotCutoff },
            },
          });
        });

        keywordMetricsAggregated++;
      } catch (error) {
        console.error(
          `[CRON] data-archiver: keyword metric aggregation failed for kw=${group.keywordId}:`,
          error,
        );
      }
    }

    const apiLogResult = await prisma.aPIResponseLog.deleteMany({
      where: { createdAt: { lt: apiLogCutoff } },
    });
    apiLogsDeleted = apiLogResult.count;

    const trendResult = await prisma.trendOpportunity.updateMany({
      where: {
        createdAt: { lt: trendCutoff },
        status: { in: ['NEW', 'REVIEWING'] },
      },
      data: { status: 'EXPIRED' },
    });
    trendsExpired = trendResult.count;

    return {
      itemsProcessed: positionsAggregated + keywordMetricsAggregated + apiLogsDeleted + trendsExpired,
      metadata: {
        positionsAggregated,
        keywordMetricsAggregated,
        apiLogsDeleted,
        trendsExpired,
      },
    };
  });
}
