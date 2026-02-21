import { sendRequest, getResult } from '@/lib/asomobile/client';
import type {
  AppKeywordsResult,
  KeywordCheckResult,
} from '@/lib/asomobile/types';
import prisma from '@/lib/prisma';
import { Keyword } from '@prisma/client';
import { calculateDifficulty } from '@/lib/optimization/keyword-scorer';

const MAX_POLL_ATTEMPTS = 20;
const POLL_INTERVAL_MS = 3_000;

async function pollResult<T>(
  endpoint: 'app-keywords' | 'keyword-check',
  ticketId: string,
): Promise<T | null> {
  for (let i = 0; i < MAX_POLL_ATTEMPTS; i++) {
    const result = await getResult<T>(endpoint, ticketId);
    if (result.status === 'done' && result.result) return result.result;
    if (result.status === 'error') return null;
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }
  return null;
}

export async function scanCompetitorKeywords(
  appId: string,
  country: string,
): Promise<Keyword[]> {
  const ticket = await sendRequest('app-keywords', { app_id: appId, country });

  await prisma.aSOMobileTask.create({
    data: {
      ticketId: ticket.ticket_id,
      endpoint: 'app-keywords',
      method: 'POST',
      params: { app_id: appId, country },
      status: 'POLLING',
      relatedEntityType: 'competitor',
      relatedEntityId: appId,
    },
  });

  const result = await pollResult<AppKeywordsResult>('app-keywords', ticket.ticket_id);

  await prisma.aSOMobileTask.update({
    where: { ticketId: ticket.ticket_id },
    data: {
      status: result ? 'COMPLETED' : 'FAILED',
        result: result ? JSON.parse(JSON.stringify(result)) : undefined,
      completedAt: new Date(),
    },
  });

  if (!result?.keywords?.length) return [];

  const savedKeywords: Keyword[] = [];

  for (const kw of result.keywords) {
    const normalizedText = kw.keyword.toLowerCase().trim();

    const keyword = await prisma.keyword.upsert({
      where: {
        normalizedText_locale_country: {
          normalizedText,
          locale: 'ru',
          country,
        },
      },
      update: {
        trafficScore: kw.traffic_score,
        lastCheckedAt: new Date(),
      },
      create: {
        text: kw.keyword,
        normalizedText,
        locale: 'ru',
        country,
        trafficScore: kw.traffic_score,
        lastCheckedAt: new Date(),
      },
    });

    savedKeywords.push(keyword);
  }

  return savedKeywords;
}
