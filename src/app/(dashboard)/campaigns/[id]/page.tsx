import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import { CampaignDetailClient } from './page-client';

export default async function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const campaign = await prisma.pushCampaign.findUnique({
    where: { id },
    include: {
      app: {
        select: {
          id: true, name: true, iconUrl: true, bundleId: true,
          categoryRank: true, organicDownloads: true,
        },
      },
      dailyPlans: { orderBy: { day: 'asc' } },
      pessimizations: {
        orderBy: { detectedAt: 'desc' },
        take: 5,
        select: { id: true, type: true, severity: true, detectedAt: true, avgPositionDrop: true },
      },
      versions: {
        orderBy: { version: 'desc' },
        take: 20,
      },
    },
  });

  if (!campaign) notFound();

  return <CampaignDetailClient campaign={JSON.parse(JSON.stringify(campaign))} />;
}
