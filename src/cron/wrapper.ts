import prisma from '@/lib/prisma';

const RETRY_DELAYS_MS = [1_000, 5_000, 15_000];

export async function withCronWrapper(
  jobName: string,
  fn: () => Promise<{ itemsProcessed?: number; metadata?: Record<string, unknown> }>,
): Promise<void> {
  const log = await prisma.cronJobLog.create({
    data: { jobName, status: 'RUNNING', startedAt: new Date() },
  });

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
    try {
      const result = await fn();
      const durationMs = Date.now() - log.startedAt.getTime();

      await prisma.cronJobLog.update({
        where: { id: log.id },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          durationMs,
          itemsProcessed: result.itemsProcessed,
          metadata: (result.metadata as object) ?? {},
          retryCount: attempt,
        },
      });
      return;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < RETRY_DELAYS_MS.length) {
        await prisma.cronJobLog.update({
          where: { id: log.id },
          data: { status: 'RETRYING', retryCount: attempt + 1 },
        });
        await sleep(RETRY_DELAYS_MS[attempt]);
      }
    }
  }

  const durationMs = Date.now() - log.startedAt.getTime();

  await prisma.cronJobLog.update({
    where: { id: log.id },
    data: {
      status: 'FAILED',
      completedAt: new Date(),
      durationMs,
      error: lastError?.message ?? 'Unknown error',
      retryCount: RETRY_DELAYS_MS.length,
    },
  });

  const admins = await prisma.user.findMany({
    where: { role: 'ADMIN' },
    select: { id: true },
  });

  if (admins.length > 0) {
    await prisma.notification.createMany({
      data: admins.map((admin) => ({
        userId: admin.id,
        type: 'CRON_JOB_FAILED' as const,
        severity: 'ERROR' as const,
        title: `Cron job failed: ${jobName}`,
        body: `Job "${jobName}" failed after ${RETRY_DELAYS_MS.length} retries. Error: ${lastError?.message ?? 'Unknown'}`,
        entityType: 'CronJobLog',
        entityId: log.id,
      })),
    });
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
