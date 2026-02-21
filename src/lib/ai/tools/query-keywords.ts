import prisma from '@/lib/prisma';
import type { AITool } from './types';

export const queryKeywordsTool: AITool = {
  name: 'query_keywords',
  description: 'Search and filter keywords in the database. Returns keyword text, traffic score, SAP, competition, niche, and app count.',
  parameters: {
    type: 'object',
    properties: {
      search: { type: 'string', description: 'Search text to match against keyword text' },
      nicheId: { type: 'string', description: 'Filter by niche ID' },
      minTraffic: { type: 'number', description: 'Minimum traffic score' },
      maxTraffic: { type: 'number', description: 'Maximum traffic score' },
      intent: { type: 'string', description: 'Keyword intent: NAVIGATIONAL, INFORMATIONAL, TRANSACTIONAL, MIXED' },
      limit: { type: 'number', description: 'Max results to return (default 10, max 25)' },
    },
  },
  execute: async (args) => {
    const limit = Math.min(Number(args.limit) || 10, 25);
    const where: Record<string, unknown> = {};

    if (args.search) {
      where.text = { contains: String(args.search), mode: 'insensitive' };
    }
    if (args.nicheId) where.nicheId = String(args.nicheId);
    if (args.intent) where.intent = String(args.intent);

    if (args.minTraffic != null || args.maxTraffic != null) {
      const traffic: Record<string, number> = {};
      if (args.minTraffic != null) traffic.gte = Number(args.minTraffic);
      if (args.maxTraffic != null) traffic.lte = Number(args.maxTraffic);
      where.trafficScore = traffic;
    }

    const keywords = await prisma.keyword.findMany({
      where,
      take: limit,
      orderBy: { trafficScore: 'desc' },
      include: {
        niche: { select: { id: true, name: true, displayName: true } },
        _count: { select: { appKeywords: true } },
      },
    });

    return keywords.map(k => ({
      id: k.id,
      text: k.text,
      trafficScore: k.trafficScore,
      sap: k.sap,
      competition: k.competition,
      difficulty: k.difficulty,
      intent: k.intent,
      niche: k.niche?.displayName ?? null,
      appCount: k._count.appKeywords,
    }));
  },
};
