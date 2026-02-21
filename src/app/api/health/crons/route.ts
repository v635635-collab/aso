import { apiSuccess, apiError } from '@/lib/utils';
import prisma from '@/lib/prisma';
import { CRON_SCHEDULES } from '@/config/cron-schedule';

export async function GET() {
  try {
    const jobNames = Object.keys(CRON_SCHEDULES);

    const latestLogs = await Promise.all(
      jobNames.map(async (jobName) => {
        const log = await prisma.cronJobLog.findFirst({
          where: { jobName },
          orderBy: { startedAt: 'desc' },
        });
        return { jobName, log };
      })
    );

    const result = latestLogs.map(({ jobName, log }) => {
      const config = CRON_SCHEDULES[jobName];
      return {
        jobName,
        schedule: config.schedule,
        description: config.description,
        lastRun: log
          ? {
              id: log.id,
              status: log.status,
              startedAt: log.startedAt,
              completedAt: log.completedAt,
              durationMs: log.durationMs,
              error: log.error,
              itemsProcessed: log.itemsProcessed,
            }
          : null,
      };
    });

    return apiSuccess(result);
  } catch (error) {
    console.error('[API] GET /health/crons error:', error);
    return apiError('INTERNAL_ERROR', 'Failed to fetch cron status', 500);
  }
}
