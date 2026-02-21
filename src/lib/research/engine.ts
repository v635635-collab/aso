import prisma from '@/lib/prisma';
import type { ResearchSession } from '@prisma/client';
import { expandKeyword } from './suggest-chain';
import { calculateKeywordScore, calculateDifficulty } from '@/lib/optimization/keyword-scorer';
import { DEFAULT_LOCALE, DEFAULT_COUNTRY } from '@/config/constants';

export interface StartResearchParams {
  name: string;
  seedKeywords: string[];
  targetLocale?: string;
  targetCountry?: string;
  maxKeywords?: number;
  minTraffic?: number;
  nicheId?: string;
  triggeredBy: string;
}

export async function startResearch(params: StartResearchParams): Promise<ResearchSession> {
  const session = await prisma.researchSession.create({
    data: {
      name: params.name,
      seedKeywords: params.seedKeywords,
      targetLocale: params.targetLocale || DEFAULT_LOCALE,
      targetCountry: params.targetCountry || DEFAULT_COUNTRY,
      maxKeywords: params.maxKeywords || 500,
      minTraffic: params.minTraffic || 5,
      nicheId: params.nicheId || null,
      triggeredBy: params.triggeredBy,
      totalSeeds: params.seedKeywords.length,
      status: 'RUNNING',
      startedAt: new Date(),
    },
  });

  return session;
}

export async function processResearchBatch(sessionId: string): Promise<{
  newKeywords: number;
  processedSeeds: number;
  isComplete: boolean;
}> {
  const session = await prisma.researchSession.findUnique({ where: { id: sessionId } });
  if (!session) throw new Error(`Session ${sessionId} not found`);
  if (session.status !== 'RUNNING') {
    return { newKeywords: 0, processedSeeds: session.processedSeeds, isComplete: session.status === 'COMPLETED' };
  }

  const { seedKeywords, targetLocale, targetCountry, maxKeywords, minTraffic, processedSeeds } = session;
  const remainingSeeds = seedKeywords.slice(processedSeeds);
  const batchSize = Math.min(5, remainingSeeds.length);
  const batch = remainingSeeds.slice(0, batchSize);

  let newKeywords = 0;

  for (const seed of batch) {
    if (session.foundKeywords + newKeywords >= maxKeywords) break;

    try {
      const suggestions = await expandKeyword(seed, 0, 2, targetCountry, targetLocale);

      for (const s of suggestions) {
        if (s.trafficScore < minTraffic) continue;
        if (session.foundKeywords + newKeywords >= maxKeywords) break;

        const normalizedText = s.keyword.toLowerCase().trim();
        const difficulty = calculateDifficulty({
          trafficScore: s.trafficScore,
          sap: s.sap,
          competition: s.competition,
          totalApps: 0,
        });

        const keyword = await prisma.keyword.upsert({
          where: {
            normalizedText_locale_country: {
              normalizedText,
              locale: targetLocale,
              country: targetCountry,
            },
          },
          update: {
            trafficScore: s.trafficScore,
            sap: s.sap,
            competition: s.competition,
            difficulty,
            nicheId: session.nicheId || undefined,
            lastCheckedAt: new Date(),
          },
          create: {
            text: s.keyword,
            normalizedText,
            locale: targetLocale,
            country: targetCountry,
            trafficScore: s.trafficScore,
            sap: s.sap,
            competition: s.competition,
            difficulty,
            nicheId: session.nicheId || null,
            lastCheckedAt: new Date(),
          },
        });

        await prisma.researchKeyword.upsert({
          where: {
            sessionId_keywordId: { sessionId, keywordId: keyword.id },
          },
          update: {},
          create: {
            sessionId,
            keywordId: keyword.id,
            discoveryMethod: 'suggest_chain',
            depth: s.depth,
          },
        });

        await prisma.keywordMetricSnapshot.create({
          data: {
            keywordId: keyword.id,
            trafficScore: s.trafficScore,
            sap: s.sap,
            competition: s.competition,
            source: 'asomobile',
          },
        });

        newKeywords++;
      }
    } catch (err) {
      console.error(`Error processing seed "${seed}":`, err);
    }
  }

  const newProcessedSeeds = processedSeeds + batchSize;
  const isComplete = newProcessedSeeds >= seedKeywords.length ||
    session.foundKeywords + newKeywords >= maxKeywords;

  await prisma.researchSession.update({
    where: { id: sessionId },
    data: {
      processedSeeds: newProcessedSeeds,
      foundKeywords: { increment: newKeywords },
      status: isComplete ? 'COMPLETED' : 'RUNNING',
      completedAt: isComplete ? new Date() : null,
    },
  });

  return {
    newKeywords,
    processedSeeds: newProcessedSeeds,
    isComplete,
  };
}
