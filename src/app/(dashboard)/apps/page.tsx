import prisma from '@/lib/prisma';
import { AppsPageClient } from './page-client';

export default async function AppsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; status?: string; accountId?: string; view?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const limit = 20;
  const search = params.search || '';
  const status = params.status || '';
  const accountId = params.accountId || '';
  const view = params.view || 'grid';

  const where: Record<string, unknown> = {};
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { bundleId: { contains: search, mode: 'insensitive' } },
      { appleId: { contains: search, mode: 'insensitive' } },
    ];
  }
  if (status) where.status = status;
  if (accountId) where.accountId = accountId;

  const [apps, total, accounts] = await Promise.all([
    prisma.app.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        account: { select: { id: true, email: true, teamName: true } },
        niche: { select: { id: true, name: true, displayName: true } },
        _count: { select: { keywords: true, pushCampaigns: true } },
      },
    }),
    prisma.app.count({ where }),
    prisma.appleAccount.findMany({
      orderBy: { email: 'asc' },
      select: { id: true, email: true, teamName: true },
    }),
  ]);

  return (
    <AppsPageClient
      apps={JSON.parse(JSON.stringify(apps))}
      accounts={JSON.parse(JSON.stringify(accounts))}
      total={total}
      page={page}
      limit={limit}
      search={search}
      status={status}
      accountId={accountId}
      view={view}
    />
  );
}
