import prisma from '@/lib/prisma';
import { withCronWrapper } from '../wrapper';
import { sendRequest, getResult } from '@/lib/asomobile/client';
import { QueuePriority } from '@/lib/asomobile/types';
import type { KeywordCheckResult } from '@/lib/asomobile/types';

const POLL_INTERVAL_MS = 3_000;
const MAX_POLL_ATTEMPTS = 20;

async function pollKeywordCheck(ticketId: string): Promise<KeywordCheckResult | null> {
  for (let i = 0; i < MAX_POLL_ATTEMPTS; i++) {
    const res = await getResult<KeywordCheckResult>('keyword-check', ticketId, QueuePriority.LOW);
    if (res.status === 'done' && res.data) return res.data;
    if (res.status === 'error') return null;
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }
  return null;
}

export async function keywordMetricsRefreshJob(): Promise<void> {
  await withCronWrapper('keyword-metrics-refresh', async () => {
    const keywords = await prisma.keyword.findMany({
      where: {
        niche: {
          apps: { some: { status: 'LIVE' } },
        },
      },
      select: { id: true, text: true, locale: true, country: true },
    });

    let processed = 0;

    for (const kw of keywords) {
      try {
        const ticket = await sendRequest(
          'keyword-check',
          { keyword: kw.text, country: kw.country, platform: 'IOS', ios_device: 'IPHONE' },
          QueuePriority.NORMAL,
        );

        const result = await pollKeywordCheck(ticket.ticket_id);
        if (!result) continue;

        await prisma.keywordMetricSnapshot.create({
          data: {
            keywordId: kw.id,
            trafficScore: result.traffic.value,
            sap: result.ci.value,
            competition: result.apps_count,
            totalApps: result.apps_count,
            source: 'asomobile',
          },
        });

        await prisma.keyword.update({
          where: { id: kw.id },
          data: {
            trafficScore: result.traffic.value,
            sap: result.ci.value,
            competition: result.apps_count,
            totalApps: result.apps_count,
            lastCheckedAt: new Date(),
          },
        });

        processed++;
      } catch (error) {
        console.error(`[CRON] keyword-metrics-refresh: failed for keyword=${kw.id}:`, error);
      }
    }

    return { itemsProcessed: processed, metadata: { totalKeywords: keywords.length } };
  });
}
