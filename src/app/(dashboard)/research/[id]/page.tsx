import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { ResearchDetailClient } from './page-client';

export default async function ResearchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const session = await prisma.researchSession.findUnique({
    where: { id },
    include: {
      niche: { select: { id: true, name: true, displayName: true } },
      keywords: {
        include: {
          keyword: {
            select: {
              id: true,
              text: true,
              trafficScore: true,
              sap: true,
              competition: true,
              difficulty: true,
              intent: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!session) notFound();

  return <ResearchDetailClient session={JSON.parse(JSON.stringify(session))} />;
}
