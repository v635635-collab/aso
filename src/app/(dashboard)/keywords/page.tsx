import prisma from '@/lib/prisma';
import { KeywordsPageClient } from './page-client';

export default async function KeywordsPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    search?: string;
    nicheId?: string;
    minTraffic?: string;
    maxTraffic?: string;
    intent?: string;
    sortBy?: string;
    sortOrder?: string;
  }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const limit = 20;
  const search = params.search || '';
  const nicheId = params.nicheId || '';
  const intent = params.intent || '';
  const minTraffic = params.minTraffic ? Number(params.minTraffic) : undefined;
  const maxTraffic = params.maxTraffic ? Number(params.maxTraffic) : undefined;
  const sortBy = params.sortBy || 'createdAt';
  const sortOrder = (params.sortOrder || 'desc') as 'asc' | 'desc';

  const where: Record<string, unknown> = {};

  if (search) {
    where.OR = [
      { text: { contains: search, mode: 'insensitive' } },
      { normalizedText: { contains: search.toLowerCase(), mode: 'insensitive' } },
    ];
  }

  if (nicheId) where.nicheId = nicheId;
  if (intent) where.intent = intent;

  if (minTraffic !== undefined || maxTraffic !== undefined) {
    where.trafficScore = {};
    if (minTraffic !== undefined) (where.trafficScore as Record<string, number>).gte = minTraffic;
    if (maxTraffic !== undefined) (where.trafficScore as Record<string, number>).lte = maxTraffic;
  }

  const [keywords, total, niches] = await Promise.all([
    prisma.keyword.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        niche: { select: { id: true, name: true, displayName: true } },
        _count: { select: { appKeywords: true, suggestions: true } },
      },
    }),
    prisma.keyword.count({ where }),
    prisma.niche.findMany({
      orderBy: { displayName: 'asc' },
      select: { id: true, name: true, displayName: true },
    }),
  ]);

  return (
    <KeywordsPageClient
      keywords={JSON.parse(JSON.stringify(keywords))}
      niches={niches}
      total={total}
      page={page}
      limit={limit}
      search={search}
      nicheId={nicheId}
      intent={intent}
      minTraffic={minTraffic}
      maxTraffic={maxTraffic}
      sortBy={sortBy}
      sortOrder={sortOrder}
    />
  );
}
