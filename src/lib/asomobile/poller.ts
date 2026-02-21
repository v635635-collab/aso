import prisma from '@/lib/prisma';
import { getResult } from './client';
import type { ASOMobileEndpointName } from './types';

export async function pollPendingTasks(): Promise<{ processed: number }> {
  const tasks = await prisma.aSOMobileTask.findMany({
    where: { status: { in: ['PENDING', 'POLLING'] } },
    orderBy: { createdAt: 'asc' },
  });

  let processed = 0;

  for (const task of tasks) {
    try {
      const response = await getResult(
        task.endpoint as ASOMobileEndpointName,
        task.ticketId,
      );

      if (response.status === 'done') {
        await prisma.aSOMobileTask.update({
          where: { id: task.id },
          data: {
            status: 'COMPLETED',
            result: response.data ?? undefined,
            completedAt: new Date(),
          },
        });
        processed++;
      } else if (response.status === 'error') {
        await prisma.aSOMobileTask.update({
          where: { id: task.id },
          data: {
            status: 'FAILED',
            errorMessage: response.error ?? 'Unknown error from ASOMobile',
          },
        });
        processed++;
      } else {
        const newRetryCount = task.retryCount + 1;
        const timedOut = newRetryCount > task.maxRetries;

        await prisma.aSOMobileTask.update({
          where: { id: task.id },
          data: {
            status: timedOut ? 'TIMEOUT' : 'POLLING',
            retryCount: newRetryCount,
            ...(timedOut && { errorMessage: 'Max poll attempts exceeded' }),
          },
        });
        if (timedOut) processed++;
      }
    } catch (error) {
      const newRetryCount = task.retryCount + 1;
      const failed = newRetryCount > task.maxRetries;

      await prisma.aSOMobileTask.update({
        where: { id: task.id },
        data: {
          retryCount: newRetryCount,
          status: failed ? 'FAILED' : 'POLLING',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        },
      });
      if (failed) processed++;
    }
  }

  return { processed };
}
