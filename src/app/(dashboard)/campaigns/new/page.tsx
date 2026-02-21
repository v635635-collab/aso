import prisma from '@/lib/prisma';
import { NewCampaignClient } from './page-client';

export default async function NewCampaignPage() {
  const apps = await prisma.app.findMany({
    where: { status: { in: ['LIVE', 'DRAFT', 'IN_REVIEW'] } },
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      iconUrl: true,
      bundleId: true,
      nicheId: true,
      niche: { select: { name: true, displayName: true } },
      keywords: {
        include: {
          keyword: {
            select: { id: true, text: true, trafficScore: true, difficulty: true },
          },
        },
        orderBy: { keyword: { trafficScore: 'desc' } },
      },
    },
  });

  return <NewCampaignClient apps={JSON.parse(JSON.stringify(apps))} />;
}
