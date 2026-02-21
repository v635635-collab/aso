import prisma from '@/lib/prisma';
import type { AITool } from './types';

export const queryPessimizationsTool: AITool = {
  name: 'query_pessimizations',
  description: 'Get pessimization events for apps. Returns type, severity, affected keywords, position drop, and AI analysis.',
  parameters: {
    type: 'object',
    properties: {
      appId: { type: 'string', description: 'Filter by app ID' },
      severity: { type: 'string', description: 'Filter by severity: MINOR, MODERATE, SEVERE, CRITICAL' },
      status: { type: 'string', description: 'Filter by status: DETECTED, ANALYZING, MITIGATING, RESOLVED, ACCEPTED' },
      limit: { type: 'number', description: 'Max results (default 10, max 25)' },
    },
  },
  execute: async (args) => {
    const limit = Math.min(Number(args.limit) || 10, 25);
    const where: Record<string, unknown> = {};

    if (args.appId) where.appId = String(args.appId);
    if (args.severity) where.severity = String(args.severity);
    if (args.status) where.status = String(args.status);

    const events = await prisma.pessimizationEvent.findMany({
      where,
      take: limit,
      orderBy: { detectedAt: 'desc' },
      include: {
        app: { select: { id: true, name: true } },
        campaign: { select: { id: true, name: true } },
      },
    });

    return events.map(e => ({
      id: e.id,
      appName: e.app.name,
      campaignName: e.campaign?.name ?? null,
      type: e.type,
      severity: e.severity,
      status: e.status,
      avgPositionDrop: e.avgPositionDrop,
      maxPositionDrop: e.maxPositionDrop,
      aiAnalysis: e.aiAnalysis,
      rootCause: e.rootCause,
      detectedAt: e.detectedAt.toISOString(),
      resolvedAt: e.resolvedAt?.toISOString() ?? null,
    }));
  },
};
