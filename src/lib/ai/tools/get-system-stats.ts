import prisma from '@/lib/prisma';
import type { AITool } from './types';

export const getSystemStatsTool: AITool = {
  name: 'get_system_stats',
  description: 'Get overall system statistics: total apps, keywords, niches, active campaigns, pessimization events, and research sessions.',
  parameters: {
    type: 'object',
    properties: {},
  },
  execute: async () => {
    const [
      totalApps,
      liveApps,
      totalKeywords,
      totalNiches,
      activeCampaigns,
      completedCampaigns,
      pessimizationCount,
      unresolvedPessimizations,
      researchSessions,
    ] = await Promise.all([
      prisma.app.count(),
      prisma.app.count({ where: { status: 'LIVE' } }),
      prisma.keyword.count(),
      prisma.niche.count(),
      prisma.pushCampaign.count({ where: { status: 'ACTIVE' } }),
      prisma.pushCampaign.count({ where: { status: 'COMPLETED' } }),
      prisma.pessimizationEvent.count(),
      prisma.pessimizationEvent.count({ where: { status: { in: ['DETECTED', 'ANALYZING', 'MITIGATING'] } } }),
      prisma.researchSession.count({ where: { status: 'RUNNING' } }),
    ]);

    return {
      apps: { total: totalApps, live: liveApps },
      keywords: { total: totalKeywords },
      niches: { total: totalNiches },
      campaigns: { active: activeCampaigns, completed: completedCampaigns },
      pessimizations: { total: pessimizationCount, unresolved: unresolvedPessimizations },
      research: { running: researchSessions },
    };
  },
};
