import prisma from '@/lib/prisma';
import { TitlesPageClient } from './page-client';

export default async function TitlesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string; appId?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const limit = 20;
  const status = params.status || '';
  const appId = params.appId || '';

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (appId) where.appId = appId;

  const [variants, total, apps] = await Promise.all([
    prisma.titleVariant.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: [{ score: 'desc' }, { createdAt: 'desc' }],
      include: {
        app: { select: { id: true, name: true, iconUrl: true, bundleId: true } },
      },
    }),
    prisma.titleVariant.count({ where }),
    prisma.app.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    }),
  ]);

  return (
    <TitlesPageClient
      variants={JSON.parse(JSON.stringify(variants))}
      apps={apps}
      total={total}
      page={page}
      limit={limit}
      status={status}
      appId={appId}
    />
  );
}
