import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import { AppDetailClient } from './page-client';

export default async function AppDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const app = await prisma.app.findUnique({
    where: { id },
    include: {
      account: { select: { id: true, email: true, teamName: true, status: true } },
      niche: { select: { id: true, name: true, displayName: true } },
      keywords: {
        take: 20,
        orderBy: { currentPosition: 'asc' },
        include: { keyword: { select: { id: true, text: true, trafficScore: true } } },
      },
      pushCampaigns: {
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, name: true, status: true, strategy: true,
          totalInstalls: true, startDate: true, endDate: true,
        },
      },
      competitors: {
        take: 10,
        include: { competitor: { select: { id: true, name: true, iconUrl: true, rating: true } } },
      },
      _count: {
        select: { keywords: true, pushCampaigns: true, positionSnapshots: true, titleVariants: true, competitors: true },
      },
    },
  });

  if (!app) notFound();

  const accounts = await prisma.appleAccount.findMany({
    orderBy: { email: 'asc' },
    select: { id: true, email: true, teamName: true },
  });

  return (
    <AppDetailClient
      app={JSON.parse(JSON.stringify(app))}
      accounts={JSON.parse(JSON.stringify(accounts))}
    />
  );
}
