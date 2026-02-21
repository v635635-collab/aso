import prisma from '@/lib/prisma';
import { ResearchPageClient } from './page-client';

export default async function ResearchPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const limit = 20;

  const [sessions, total] = await Promise.all([
    prisma.researchSession.findMany({
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        niche: { select: { id: true, name: true, displayName: true } },
        _count: { select: { keywords: true } },
      },
    }),
    prisma.researchSession.count(),
  ]);

  return (
    <ResearchPageClient
      sessions={JSON.parse(JSON.stringify(sessions))}
      total={total}
      page={page}
      limit={limit}
    />
  );
}
