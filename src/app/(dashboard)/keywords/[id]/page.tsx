import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { KeywordDetailClient } from './page-client';

export default async function KeywordDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const keyword = await prisma.keyword.findUnique({
    where: { id },
    include: {
      niche: { select: { id: true, name: true, displayName: true } },
      metrics: {
        orderBy: { capturedAt: 'desc' },
        take: 30,
      },
      appKeywords: {
        include: {
          app: { select: { id: true, name: true, iconUrl: true, status: true } },
        },
      },
      suggestions: {
        include: {
          suggestedKeyword: {
            select: { id: true, text: true, trafficScore: true, sap: true, competition: true },
          },
        },
        take: 20,
      },
      _count: { select: { worldwideChecks: true, researchKeywords: true } },
    },
  });

  if (!keyword) notFound();

  return <KeywordDetailClient keyword={JSON.parse(JSON.stringify(keyword))} />;
}
