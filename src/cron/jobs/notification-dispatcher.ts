import prisma from '@/lib/prisma';
import { withCronWrapper } from '../wrapper';
import { getTelegramClient } from '@/lib/notifications/telegram';
import { getSetting } from '@/lib/settings/service';

const TELEGRAM_TYPES = new Set([
  'PESSIMIZATION_DETECTED',
  'PESSIMIZATION_RESOLVED',
  'CAMPAIGN_COMPLETED',
  'CAMPAIGN_PESSIMIZED',
  'POSITION_ALERT',
  'SYSTEM_ALERT',
  'CRON_JOB_FAILED',
]);

export async function notificationDispatcherJob(): Promise<void> {
  await withCronWrapper('notification-dispatcher', async () => {
    const pending = await prisma.notification.findMany({
      where: {
        isTelegramed: false,
        type: { in: [...TELEGRAM_TYPES] as import('@prisma/client').NotificationType[] },
      },
      orderBy: { createdAt: 'asc' },
      take: 50,
    });

    if (pending.length === 0) {
      return { itemsProcessed: 0 };
    }

    const telegram = await getTelegramClient();
    const chatId = (await getSetting('telegram.alertsChatId')) as string | null;

    if (!telegram || !chatId) {
      return {
        itemsProcessed: 0,
        metadata: { skipped: pending.length, reason: 'Telegram not configured' },
      };
    }

    let dispatched = 0;

    for (const notif of pending) {
      try {
        const sent = await telegram.sendAlert(
          chatId,
          notif.title,
          notif.body,
          notif.severity,
        );

        if (sent) {
          await prisma.notification.update({
            where: { id: notif.id },
            data: { isTelegramed: true },
          });
          dispatched++;
        }
      } catch (error) {
        console.error(
          `[CRON] notification-dispatcher: failed for notif=${notif.id}:`,
          error,
        );
      }
    }

    return {
      itemsProcessed: dispatched,
      metadata: { total: pending.length },
    };
  });
}
