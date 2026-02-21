import prisma from '@/lib/prisma';
import { NichesPageClient } from './page-client';

export default async function NichesPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; riskLevel?: string }>;
}) {
  const params = await searchParams;
  const search = params.search || '';
  const riskLevel = params.riskLevel || '';

  const where: Record<string, unknown> = {};

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { displayName: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (riskLevel) where.riskLevel = riskLevel;

  const niches = await prisma.niche.findMany({
    where,
    orderBy: { totalTraffic: 'desc' },
    include: {
      _count: { select: { keywords: true, apps: true } },
    },
  });

  return (
    <NichesPageClient
      niches={JSON.parse(JSON.stringify(niches))}
      search={search}
      riskLevel={riskLevel}
    />
  );
}
