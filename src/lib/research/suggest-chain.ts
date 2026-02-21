import { sendRequest, getResult } from '@/lib/asomobile/client';
import type { KeywordSuggestParams, KeywordSuggestResult } from '@/lib/asomobile/types';
import prisma from '@/lib/prisma';

export interface SuggestChainResult {
  keyword: string;
  trafficScore: number;
  sap: number;
  competition: number;
  depth: number;
}

interface NormalizedSuggestion {
  keyword: string;
  traffic_score: number;
}

const MAX_POLL_ATTEMPTS = 20;
const POLL_INTERVAL_MS = 3_000;

async function pollResult<T>(endpoint: 'keyword-suggest', ticketId: string): Promise<T | null> {
  for (let i = 0; i < MAX_POLL_ATTEMPTS; i++) {
    const result = await getResult<T>(endpoint, ticketId);
    if (result.status === 'done' && result.data) return result.data;
    if (result.status === 'error') return null;
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }
  return null;
}

async function fetchSuggestions(
  keyword: string,
  country: string,
  _locale: string,
): Promise<NormalizedSuggestion[]> {
  try {
    const params = { keywords: [keyword], country, platform: 'IOS' as const, ios_device: 'IPHONE' as const };
    const ticket = await sendRequest('keyword-suggest', params);

    await prisma.aSOMobileTask.create({
      data: {
        ticketId: ticket.ticket_id,
        endpoint: 'keyword-suggest',
        method: 'POST',
        params,
        status: 'POLLING',
        relatedEntityType: 'keyword',
      },
    });

    const result = await pollResult<KeywordSuggestResult>('keyword-suggest', ticket.ticket_id);

    await prisma.aSOMobileTask.update({
      where: { ticketId: ticket.ticket_id },
      data: {
        status: result ? 'COMPLETED' : 'FAILED',
        result: result ? JSON.parse(JSON.stringify(result)) : undefined,
        completedAt: new Date(),
      },
    });

    const suggestions = result?.[0]?.suggestions ?? [];
    return suggestions.map((s) => ({
      keyword: s.suggestKeyword,
      traffic_score: s.traffic.value,
    }));
  } catch {
    return [];
  }
}

export async function expandKeyword(
  keyword: string,
  depth: number,
  maxDepth: number,
  country: string,
  locale: string,
  seen: Set<string> = new Set(),
): Promise<SuggestChainResult[]> {
  if (depth > maxDepth) return [];

  const normalized = keyword.toLowerCase().trim();
  if (seen.has(normalized)) return [];
  seen.add(normalized);

  const suggestions = await fetchSuggestions(keyword, country, locale);
  const results: SuggestChainResult[] = [];

  for (const s of suggestions) {
    const norm = s.keyword.toLowerCase().trim();
    if (seen.has(norm)) continue;
    seen.add(norm);

    results.push({
      keyword: s.keyword,
      trafficScore: s.traffic_score,
      sap: 0,
      competition: 0,
      depth,
    });
  }

  if (depth < maxDepth) {
    const topSuggestions = results
      .sort((a, b) => b.trafficScore - a.trafficScore)
      .slice(0, 3);

    for (const top of topSuggestions) {
      const deeper = await expandKeyword(top.keyword, depth + 1, maxDepth, country, locale, seen);
      results.push(...deeper);
    }
  }

  return results;
}
