import prisma from '@/lib/prisma';

interface ContextParams {
  appId?: string;
  nicheId?: string;
  campaignId?: string;
}

export async function buildAIContext(params?: ContextParams): Promise<string> {
  const sections: string[] = [];

  const [appCount, keywordCount, nicheCount, activeCampaigns] = await Promise.all([
    prisma.app.count(),
    prisma.keyword.count(),
    prisma.niche.count(),
    prisma.pushCampaign.count({ where: { status: 'ACTIVE' } }),
  ]);

  sections.push(
    `## System Overview`,
    `Apps: ${appCount} | Keywords: ${keywordCount} | Niches: ${nicheCount} | Active campaigns: ${activeCampaigns}`
  );

  const recentNotifs = await prisma.notification.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    select: { title: true, type: true, severity: true, createdAt: true },
  });

  if (recentNotifs.length > 0) {
    sections.push('', '## Recent Activity');
    for (const n of recentNotifs) {
      sections.push(`- [${n.severity}] ${n.title} (${n.type}, ${n.createdAt.toISOString().slice(0, 16)})`);
    }
  }

  if (params?.appId) {
    const app = await prisma.app.findUnique({
      where: { id: params.appId },
      include: {
        niche: { select: { displayName: true } },
        keywords: {
          take: 10,
          orderBy: { keyword: { trafficScore: 'desc' } },
          include: { keyword: { select: { text: true, trafficScore: true } } },
        },
      },
    });

    if (app) {
      sections.push('', `## Current App: ${app.name}`);
      sections.push(`Status: ${app.status} | Category Rank: ${app.categoryRank ?? 'N/A'} | Rating: ${app.rating ?? 'N/A'}`);
      sections.push(`Niche: ${app.niche?.displayName ?? 'None'} | Downloads: ${app.organicDownloads}`);

      if (app.keywords.length > 0) {
        sections.push('', 'Top keywords:');
        for (const ak of app.keywords) {
          sections.push(`- "${ak.keyword.text}" (traffic: ${ak.keyword.trafficScore ?? 'N/A'}, pos: ${ak.currentPosition ?? 'N/A'})`);
        }
      }
    }
  }

  if (params?.nicheId) {
    const niche = await prisma.niche.findUnique({
      where: { id: params.nicheId },
      include: { _count: { select: { keywords: true, apps: true } } },
    });

    if (niche) {
      sections.push('', `## Current Niche: ${niche.displayName}`);
      sections.push(`Keywords: ${niche._count.keywords} | Apps: ${niche._count.apps} | Traffic: ${niche.totalTraffic} | Risk: ${niche.riskLevel}`);
    }
  }

  if (params?.campaignId) {
    const campaign = await prisma.pushCampaign.findUnique({
      where: { id: params.campaignId },
      include: {
        app: { select: { name: true } },
        dailyPlans: {
          take: 5,
          orderBy: { day: 'desc' },
          select: { day: true, plannedInstalls: true, actualInstalls: true, status: true },
        },
      },
    });

    if (campaign) {
      sections.push('', `## Current Campaign: ${campaign.name}`);
      sections.push(`App: ${campaign.app.name} | Status: ${campaign.status} | Strategy: ${campaign.strategy}`);
      sections.push(`Installs: ${campaign.completedInstalls}/${campaign.totalInstalls} | Budget: $${campaign.spentBudget}/$${campaign.totalBudget}`);

      if (campaign.dailyPlans.length > 0) {
        sections.push('', 'Recent daily plans:');
        for (const dp of campaign.dailyPlans) {
          sections.push(`- Day ${dp.day}: ${dp.actualInstalls}/${dp.plannedInstalls} installs (${dp.status})`);
        }
      }
    }
  }

  const result = sections.join('\n');
  return result.slice(0, 16000);
}
