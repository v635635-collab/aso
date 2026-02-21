import prisma from '@/lib/prisma';
import type { AITool } from './types';

export const queryNichesTool: AITool = {
  name: 'query_niches',
  description: 'List niches with aggregated statistics including total traffic, keyword count, app count, and risk level.',
  parameters: {
    type: 'object',
    properties: {
      search: { type: 'string', description: 'Search text to match niche name' },
      riskLevel: { type: 'string', description: 'Filter by risk level: LOW, MEDIUM, HIGH, CRITICAL' },
      limit: { type: 'number', description: 'Max results (default 10, max 25)' },
    },
  },
  execute: async (args) => {
    const limit = Math.min(Number(args.limit) || 10, 25);
    const where: Record<string, unknown> = {};

    if (args.search) {
      where.OR = [
        { name: { contains: String(args.search), mode: 'insensitive' } },
        { displayName: { contains: String(args.search), mode: 'insensitive' } },
      ];
    }
    if (args.riskLevel) where.riskLevel = String(args.riskLevel);

    const niches = await prisma.niche.findMany({
      where,
      take: limit,
      orderBy: { totalTraffic: 'desc' },
      include: {
        _count: { select: { keywords: true, apps: true } },
      },
    });

    return niches.map(n => ({
      id: n.id,
      name: n.displayName,
      slug: n.name,
      totalTraffic: n.totalTraffic,
      avgSAP: n.avgSAP,
      avgCompetition: n.avgCompetition,
      keywordCount: n._count.keywords,
      appCount: n._count.apps,
      riskLevel: n.riskLevel,
    }));
  },
};
