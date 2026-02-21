import prisma from '@/lib/prisma';
import type { AITool } from './types';

export const queryPositionsTool: AITool = {
  name: 'query_positions',
  description: 'Get position history for a specific app and keyword combination. Returns recent position snapshots with changes.',
  parameters: {
    type: 'object',
    properties: {
      appId: { type: 'string', description: 'App ID (required)' },
      keywordId: { type: 'string', description: 'Keyword ID (optional — if omitted, returns all keyword positions for the app)' },
      days: { type: 'number', description: 'Number of days to look back (default 30)' },
      limit: { type: 'number', description: 'Max results (default 20, max 50)' },
    },
    required: ['appId'],
  },
  execute: async (args) => {
    const limit = Math.min(Number(args.limit) || 20, 50);
    const days = Number(args.days) || 30;
    const since = new Date();
    since.setDate(since.getDate() - days);

    const where: Record<string, unknown> = {
      appId: String(args.appId),
      capturedAt: { gte: since },
    };

    if (args.keywordId) where.keywordId = String(args.keywordId);

    const snapshots = await prisma.positionSnapshot.findMany({
      where,
      take: limit,
      orderBy: { capturedAt: 'desc' },
      include: {
        keyword: { select: { id: true, text: true, trafficScore: true } },
      },
    });

    return snapshots.map(s => ({
      keywordText: s.keyword.text,
      keywordTraffic: s.keyword.trafficScore,
      position: s.position,
      previousPosition: s.previousPosition,
      change: s.change,
      capturedAt: s.capturedAt.toISOString(),
    }));
  },
};
