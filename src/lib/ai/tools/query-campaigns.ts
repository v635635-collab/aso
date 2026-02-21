import prisma from '@/lib/prisma';
import type { AITool } from './types';

export const queryCampaignsTool: AITool = {
  name: 'query_campaigns',
  description: 'Search push campaigns by app, status, or strategy. Returns campaign name, status, installs, budget, and duration.',
  parameters: {
    type: 'object',
    properties: {
      appId: { type: 'string', description: 'Filter by app ID' },
      status: { type: 'string', description: 'Campaign status: DRAFT, REVIEW, APPROVED, ACTIVE, PAUSED, COMPLETED, CANCELLED, PESSIMIZED' },
      limit: { type: 'number', description: 'Max results (default 10, max 25)' },
    },
  },
  execute: async (args) => {
    const limit = Math.min(Number(args.limit) || 10, 25);
    const where: Record<string, unknown> = {};

    if (args.appId) where.appId = String(args.appId);
    if (args.status) where.status = String(args.status);

    const campaigns = await prisma.pushCampaign.findMany({
      where,
      take: limit,
      orderBy: { updatedAt: 'desc' },
      include: {
        app: { select: { id: true, name: true } },
        _count: { select: { dailyPlans: true } },
      },
    });

    return campaigns.map(c => ({
      id: c.id,
      name: c.name,
      appName: c.app.name,
      status: c.status,
      strategy: c.strategy,
      totalInstalls: c.totalInstalls,
      completedInstalls: c.completedInstalls,
      totalBudget: c.totalBudget,
      spentBudget: c.spentBudget,
      durationDays: c.durationDays,
      dailyPlanCount: c._count.dailyPlans,
      startDate: c.startDate,
      endDate: c.endDate,
    }));
  },
};
