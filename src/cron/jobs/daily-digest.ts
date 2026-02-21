import prisma from '@/lib/prisma';
import { withCronWrapper } from '../wrapper';
import { chatCompletion } from '@/lib/ai/openrouter';
import { createNotification } from '@/lib/notifications/service';
import { getTelegramClient } from '@/lib/notifications/telegram';
import { getSetting } from '@/lib/settings/service';

export async function dailyDigestJob(): Promise<void> {
  await withCronWrapper('daily-digest', async () => {
    const since = new Date();
    since.setDate(since.getDate() - 1);

    const [
      newKeywords,
      positionChanges,
      activeCampaigns,
      pessimizationEvents,
      trendOpportunities,
    ] = await Promise.all([
      prisma.keyword.count({ where: { createdAt: { gte: since } } }),
      prisma.positionSnapshot.findMany({
        where: { capturedAt: { gte: since }, change: { not: null } },
        orderBy: { change: 'desc' },
        take: 10,
        include: {
          app: { select: { name: true } },
          keyword: { select: { text: true } },
        },
      }),
      prisma.pushCampaign.findMany({
        where: { status: 'ACTIVE' },
        include: {
          app: { select: { name: true } },
          dailyPlans: {
            where: { date: { gte: since } },
            orderBy: { day: 'desc' },
            take: 1,
          },
        },
      }),
      prisma.pessimizationEvent.findMany({
        where: { detectedAt: { gte: since } },
        include: { app: { select: { name: true } } },
      }),
      prisma.trendOpportunity.findMany({
        where: { createdAt: { gte: since }, status: 'NEW' },
        take: 5,
      }),
    ]);

    const digestData = {
      date: new Date().toISOString().slice(0, 10),
      newKeywords,
      topPositionChanges: positionChanges.map((s) => ({
        app: s.app.name,
        keyword: s.keyword.text,
        change: s.change,
        position: s.position,
      })),
      activeCampaigns: activeCampaigns.map((c) => ({
        app: c.app.name,
        name: c.name,
        completedInstalls: c.completedInstalls,
        totalInstalls: c.totalInstalls,
      })),
      pessimizations: pessimizationEvents.map((e) => ({
        app: e.app.name,
        type: e.type,
        severity: e.severity,
      })),
      trendingOpportunities: trendOpportunities.map((t) => ({
        query: t.trendQuery,
        changePercent: t.changePercent,
        isBreakout: t.isBreakout,
      })),
    };

    const aiResult = await chatCompletion([
      {
        role: 'system',
        content:
          'You are an ASO engine assistant. Generate a concise daily digest summary in Russian. Use bullet points, highlight important changes. Keep it under 500 words.',
      },
      { role: 'user', content: JSON.stringify(digestData) },
    ]);

    const aiResponse = aiResult as { choices?: Array<{ message?: { content?: string } }> };
    const summary =
      aiResponse.choices?.[0]?.message?.content ?? 'Не удалось сгенерировать дайджест.';

    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { id: true },
    });

    for (const admin of admins) {
      await createNotification({
        userId: admin.id,
        type: 'DAILY_DIGEST',
        severity: 'INFO',
        title: `Ежедневный дайджест ${digestData.date}`,
        body: summary,
        metadata: digestData,
      });
    }

    const telegram = await getTelegramClient();
    const chatId = (await getSetting('telegram.alertsChatId')) as string | null;

    if (telegram && chatId) {
      const header = `📊 <b>Дайджест ${digestData.date}</b>\n\n`;
      await telegram.sendMessage(chatId, header + summary);
    }

    return {
      itemsProcessed: 1,
      metadata: {
        newKeywords,
        positionChanges: positionChanges.length,
        activeCampaigns: activeCampaigns.length,
        pessimizations: pessimizationEvents.length,
        trends: trendOpportunities.length,
      },
    };
  });
}
