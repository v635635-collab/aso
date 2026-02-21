import prisma from '@/lib/prisma';
import { withCronWrapper } from '../wrapper';
import { createNotification } from '@/lib/notifications/service';
import { getTelegramClient } from '@/lib/notifications/telegram';
import { getSetting } from '@/lib/settings/service';

export async function campaignDailyExecutorJob(): Promise<void> {
  await withCronWrapper('campaign-daily-executor', async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const activeCampaigns = await prisma.pushCampaign.findMany({
      where: { status: 'ACTIVE' },
      include: {
        app: { select: { id: true, name: true, appleId: true } },
        dailyPlans: {
          where: {
            date: { gte: today, lt: tomorrow },
            status: 'PENDING',
          },
        },
      },
    });

    const deliveryMode =
      ((await getSetting('push.deliveryMode')) as string | null) ?? 'manual';

    let processed = 0;

    for (const campaign of activeCampaigns) {
      for (const plan of campaign.dailyPlans) {
        try {
          if (deliveryMode === 'manual') {
            const admins = await prisma.user.findMany({
              where: { role: 'ADMIN' },
              select: { id: true },
            });

            for (const admin of admins) {
              await createNotification({
                userId: admin.id,
                type: 'PUSH_DAY_READY',
                severity: 'INFO',
                title: `День ${plan.day} готов: ${plan.plannedInstalls} установок для ${campaign.app.name}`,
                body: `Кампания "${campaign.name}" — день ${plan.day}. Запланировано ${plan.plannedInstalls} установок.`,
                entityType: 'PushDailyPlan',
                entityId: plan.id,
                actionUrl: `/campaigns/${campaign.id}`,
                actionLabel: 'Открыть кампанию',
              });
            }
          } else if (deliveryMode === 'telegram_auto') {
            const telegram = await getTelegramClient();
            const ordersChatId =
              (await getSetting('telegram.ordersChatId')) as string | null;

            if (telegram && ordersChatId) {
              const message = [
                `📱 <b>Заказ на установки</b>`,
                ``,
                `Приложение: <b>${campaign.app.name}</b>`,
                `Apple ID: <code>${campaign.app.appleId}</code>`,
                `Кампания: ${campaign.name}`,
                `День: ${plan.day}`,
                `Установок: <b>${plan.plannedInstalls}</b>`,
                `Страна: ${campaign.targetCountry}`,
                ``,
                `Ключевые слова: ${campaign.targetKeywords.join(', ')}`,
              ].join('\n');

              await telegram.sendMessage(ordersChatId, message);
            }
          }

          await prisma.pushDailyPlan.update({
            where: { id: plan.id },
            data: { status: 'SENT' },
          });

          processed++;
        } catch (error) {
          console.error(
            `[CRON] campaign-daily-executor: failed for plan=${plan.id}:`,
            error,
          );
        }
      }
    }

    return {
      itemsProcessed: processed,
      metadata: { deliveryMode, activeCampaigns: activeCampaigns.length },
    };
  });
}
