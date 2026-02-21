import prisma from '@/lib/prisma';
import { CampaignsPageClient } from './page-client';

export default async function CampaignsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string; appId?: string; search?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const limit = 20;
  const status = params.status || '';
  const appId = params.appId || '';
  const search = params.search || '';

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (appId) where.appId = appId;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [campaigns, total, apps] = await Promise.all([
    prisma.pushCampaign.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        app: { select: { id: true, name: true, iconUrl: true, bundleId: true } },
        _count: { select: { dailyPlans: true, pessimizations: true } },
      },
    }),
    prisma.pushCampaign.count({ where }),
    prisma.app.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    }),
  ]);

  return (
    <CampaignsPageClient
      campaigns={JSON.parse(JSON.stringify(campaigns))}
      apps={apps}
      total={total}
      page={page}
      limit={limit}
      status={status}
      appId={appId}
      search={search}
    />
  );
}
