import prisma from '@/lib/prisma';
import { getSetting } from '@/lib/settings/service';
import { getTelegramClient } from '@/lib/notifications/telegram';
import { createNotification } from '@/lib/notifications/service';
import { exportCampaignPlan } from './exporter';

interface ExecutionResult {
  sent: boolean;
  method: 'telegram_auto' | 'manual';
  message?: string;
}

export async function executeDailyPlan(campaignId: string, day: number): Promise<ExecutionResult> {
  const campaign = await prisma.pushCampaign.findUnique({
    where: { id: campaignId },
    include: {
      app: { select: { name: true, bundleId: true } },
      dailyPlans: { orderBy: { day: 'asc' } },
    },
  });

  if (!campaign) throw new Error(`Campaign ${campaignId} not found`);
  if (campaign.status !== 'ACTIVE') throw new Error(`Campaign is not active (status: ${campaign.status})`);

  const dailyPlan = campaign.dailyPlans.find((dp) => dp.day === day);
  if (!dailyPlan) throw new Error(`No plan for day ${day}`);
  if (dailyPlan.status !== 'PENDING') {
    return { sent: false, method: 'manual', message: `Day ${day} already ${dailyPlan.status}` };
  }

  const deliveryMode = ((await getSetting('push.deliveryMode')) as string) || 'manual';

  const dayPlanText = `Day ${day}: ${dailyPlan.plannedInstalls} installs`;
  const appInfo = `${campaign.app.name} (${campaign.app.bundleId})`;

  if (deliveryMode === 'telegram_auto') {
    const client = await getTelegramClient();
    const chatId = (await getSetting('telegram.ordersChatId')) as string;

    if (!client || !chatId) {
      return await fallbackToManual(campaign, dailyPlan, appInfo, dayPlanText);
    }

    const planExport = exportCampaignPlan(
      campaign as Parameters<typeof exportCampaignPlan>[0],
      'text'
    );

    const message = [
      `<b>Push Order — ${appInfo}</b>`,
      `Campaign: ${campaign.name}`,
      `Strategy: ${campaign.strategy}`,
      '',
      `<b>${dayPlanText}</b>`,
      `Country: ${campaign.targetCountry}`,
      `Keywords: ${campaign.targetKeywords.join(', ')}`,
      '',
      `Budget for today: $${(dailyPlan.plannedInstalls * (campaign.costPerInstall || 0)).toFixed(2)}`,
      '',
      `Full plan:\n<pre>${planExport.slice(0, 2000)}</pre>`,
    ].join('\n');

    const sent = await client.sendMessage(chatId, message);

    if (sent) {
      await prisma.pushDailyPlan.update({
        where: { id: dailyPlan.id },
        data: { status: 'SENT' },
      });
      return { sent: true, method: 'telegram_auto' };
    }

    return await fallbackToManual(campaign, dailyPlan, appInfo, dayPlanText);
  }

  return await fallbackToManual(campaign, dailyPlan, appInfo, dayPlanText);
}

async function fallbackToManual(
  campaign: { id: string; name: string },
  dailyPlan: { id: string; plannedInstalls: number; day: number },
  appInfo: string,
  dayPlanText: string
): Promise<ExecutionResult> {
  const admins = await prisma.user.findMany({
    where: { role: 'ADMIN' },
    select: { id: true },
  });

  for (const admin of admins) {
    await createNotification({
      userId: admin.id,
      type: 'PUSH_DAY_READY',
      severity: 'INFO',
      title: `Push Day Ready: ${dayPlanText}`,
      body: `Campaign "${campaign.name}" for ${appInfo} needs ${dailyPlan.plannedInstalls} installs today (day ${dailyPlan.day}).`,
      actionUrl: `/campaigns/${campaign.id}`,
      actionLabel: 'View Campaign',
      entityType: 'PushCampaign',
      entityId: campaign.id,
    });
  }

  await prisma.pushDailyPlan.update({
    where: { id: dailyPlan.id },
    data: { status: 'SENT' },
  });

  return { sent: true, method: 'manual', message: 'Notification sent to admins' };
}
