import prisma from '@/lib/prisma';
import type { AITool } from './types';

export const queryAppsTool: AITool = {
  name: 'query_apps',
  description: 'Search apps by name, status, niche, or account. Returns app name, status, category rank, rating, and keyword count.',
  parameters: {
    type: 'object',
    properties: {
      search: { type: 'string', description: 'Search text to match against app name or bundle ID' },
      status: { type: 'string', description: 'App status: DRAFT, IN_REVIEW, LIVE, SUSPENDED, REMOVED' },
      nicheId: { type: 'string', description: 'Filter by niche ID' },
      limit: { type: 'number', description: 'Max results (default 10, max 25)' },
    },
  },
  execute: async (args) => {
    const limit = Math.min(Number(args.limit) || 10, 25);
    const where: Record<string, unknown> = {};

    if (args.search) {
      where.OR = [
        { name: { contains: String(args.search), mode: 'insensitive' } },
        { bundleId: { contains: String(args.search), mode: 'insensitive' } },
      ];
    }
    if (args.status) where.status = String(args.status);
    if (args.nicheId) where.nicheId = String(args.nicheId);

    const apps = await prisma.app.findMany({
      where,
      take: limit,
      orderBy: { updatedAt: 'desc' },
      include: {
        niche: { select: { id: true, displayName: true } },
        account: { select: { email: true, teamName: true } },
        _count: { select: { keywords: true, pushCampaigns: true } },
      },
    });

    return apps.map(a => ({
      id: a.id,
      name: a.name,
      bundleId: a.bundleId,
      status: a.status,
      categoryRank: a.categoryRank,
      rating: a.rating,
      organicDownloads: a.organicDownloads,
      niche: a.niche?.displayName ?? null,
      account: a.account.teamName ?? a.account.email,
      keywordCount: a._count.keywords,
      campaignCount: a._count.pushCampaigns,
    }));
  },
};
