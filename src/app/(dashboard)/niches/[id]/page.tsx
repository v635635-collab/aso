import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { NicheDetailClient } from './page-client';

export default async function NicheDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const niche = await prisma.niche.findUnique({
    where: { id },
    include: {
      keywords: {
        orderBy: { trafficScore: 'desc' },
        take: 100,
        include: {
          niche: { select: { id: true, name: true, displayName: true } },
          _count: { select: { appKeywords: true, suggestions: true } },
        },
      },
      apps: {
        select: {
          id: true,
          name: true,
          iconUrl: true,
          status: true,
          organicDownloads: true,
          categoryRank: true,
        },
      },
      children: {
        select: {
          id: true,
          name: true,
          displayName: true,
          keywordCount: true,
          description: true,
        },
      },
      parent: { select: { id: true, name: true, displayName: true } },
      _count: { select: { keywords: true, apps: true, researchSessions: true } },
    },
  });

  if (!niche) notFound();

  return <NicheDetailClient niche={JSON.parse(JSON.stringify(niche))} />;
}
