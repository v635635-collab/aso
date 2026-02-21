import prisma from '@/lib/prisma';
import { withCronWrapper } from '../wrapper';
import { sendRequest, getResult } from '@/lib/asomobile/client';
import { QueuePriority } from '@/lib/asomobile/types';
import type { KeywordSuggestResult } from '@/lib/asomobile/types';

const POLL_INTERVAL_MS = 3_000;
const MAX_POLL_ATTEMPTS = 20;
const BATCH_SIZE = 5;

async function pollSuggest(ticketId: string): Promise<KeywordSuggestResult | null> {
  for (let i = 0; i < MAX_POLL_ATTEMPTS; i++) {
    const res = await getResult<KeywordSuggestResult>(
      'keyword-suggest',
      ticketId,
      QueuePriority.LOW,
    );
    if (res.status === 'done' && res.result) return res.result;
    if (res.status === 'error') return null;
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }
  return null;
}

export async function researchProcessorJob(): Promise<void> {
  await withCronWrapper('research-processor', async () => {
    const sessions = await prisma.researchSession.findMany({
      where: { status: 'RUNNING' },
      include: {
        keywords: { select: { keywordId: true } },
      },
    });

    let totalProcessed = 0;

    for (const session of sessions) {
      try {
        const processedSeeds = session.processedSeeds;
        const seedBatch = session.seedKeywords.slice(
          processedSeeds,
          processedSeeds + BATCH_SIZE,
        );

        if (seedBatch.length === 0) {
          await prisma.researchSession.update({
            where: { id: session.id },
            data: { status: 'COMPLETED', completedAt: new Date() },
          });
          continue;
        }

        let batchFound = 0;

        for (const seed of seedBatch) {
          try {
            const ticket = await sendRequest(
              'keyword-suggest',
              {
                query: seed,
                country: session.targetCountry,
                lang: session.targetLocale,
              },
              QueuePriority.NORMAL,
            );

            const result = await pollSuggest(ticket.ticket_id);
            if (!result?.keywords) continue;

            const filtered = result.keywords.filter(
              (kw) => kw.traffic_score >= session.minTraffic,
            );

            for (const discovered of filtered) {
              if (session.foundKeywords + batchFound >= session.maxKeywords) break;

              const keyword = await prisma.keyword.upsert({
                where: {
                  normalizedText_locale_country: {
                    normalizedText: discovered.keyword.toLowerCase().trim(),
                    locale: session.targetLocale,
                    country: session.targetCountry,
                  },
                },
                create: {
                  text: discovered.keyword,
                  normalizedText: discovered.keyword.toLowerCase().trim(),
                  locale: session.targetLocale,
                  country: session.targetCountry,
                  trafficScore: discovered.traffic_score,
                  sap: discovered.sap,
                  competition: discovered.competition,
                  nicheId: session.nicheId,
                },
                update: {
                  trafficScore: discovered.traffic_score,
                  sap: discovered.sap,
                  competition: discovered.competition,
                  lastCheckedAt: new Date(),
                },
              });

              const existsInSession = session.keywords.some(
                (rk) => rk.keywordId === keyword.id,
              );

              if (!existsInSession) {
                await prisma.researchKeyword.create({
                  data: {
                    sessionId: session.id,
                    keywordId: keyword.id,
                    discoveryMethod: 'asomobile-suggest',
                    depth: 1,
                  },
                });
                batchFound++;
              }
            }
          } catch (error) {
            console.error(
              `[CRON] research-processor: seed="${seed}" in session=${session.id} failed:`,
              error,
            );
          }
        }

        const newProcessed = processedSeeds + seedBatch.length;
        const isComplete = newProcessed >= session.seedKeywords.length;

        await prisma.researchSession.update({
          where: { id: session.id },
          data: {
            processedSeeds: newProcessed,
            foundKeywords: { increment: batchFound },
            ...(isComplete && { status: 'COMPLETED', completedAt: new Date() }),
          },
        });

        totalProcessed += seedBatch.length;
      } catch (error) {
        console.error(
          `[CRON] research-processor: session=${session.id} failed:`,
          error,
        );
        await prisma.researchSession.update({
          where: { id: session.id },
          data: { status: 'FAILED', errorMessage: String(error) },
        });
      }
    }

    return {
      itemsProcessed: totalProcessed,
      metadata: { activeSessions: sessions.length },
    };
  });
}
