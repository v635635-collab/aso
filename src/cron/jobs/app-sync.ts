import prisma from '@/lib/prisma';
import { withCronWrapper } from '../wrapper';
import { sendRequest, getResult } from '@/lib/asomobile/client';
import { QueuePriority } from '@/lib/asomobile/types';
import type { AppProfileResult } from '@/lib/asomobile/types';

const POLL_INTERVAL_MS = 3_000;
const MAX_POLL_ATTEMPTS = 20;

async function pollAppProfile(ticketId: string): Promise<AppProfileResult | null> {
  for (let i = 0; i < MAX_POLL_ATTEMPTS; i++) {
    const res = await getResult<AppProfileResult>('app-profile', ticketId, QueuePriority.LOW);
    if (res.status === 'done' && res.result) return res.result;
    if (res.status === 'error') return null;
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }
  return null;
}

export async function appSyncJob(): Promise<void> {
  await withCronWrapper('app-sync', async () => {
    const apps = await prisma.app.findMany({
      where: { status: 'LIVE' },
      select: { id: true, appleId: true, country: true },
    });

    let processed = 0;

    for (const app of apps) {
      try {
        const ticket = await sendRequest(
          'app-profile',
          { app_id: app.appleId, country: app.country },
          QueuePriority.NORMAL,
        );

        const result = await pollAppProfile(ticket.ticket_id);
        if (!result) continue;

        await prisma.app.update({
          where: { id: app.id },
          data: {
            rating: result.rating,
            reviewCount: result.review_count,
            lastSyncAt: new Date(),
          },
        });

        processed++;
      } catch (error) {
        console.error(`[CRON] app-sync: failed for app=${app.id}:`, error);
      }
    }

    return { itemsProcessed: processed, metadata: { totalApps: apps.length } };
  });
}
