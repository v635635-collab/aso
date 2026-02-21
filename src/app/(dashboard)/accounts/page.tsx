import prisma from '@/lib/prisma';
import { AccountsPageClient } from './page-client';

export default async function AccountsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; status?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const limit = 20;
  const search = params.search || '';
  const status = params.status || '';

  const where: Record<string, unknown> = {};
  if (search) {
    where.OR = [
      { email: { contains: search, mode: 'insensitive' } },
      { teamName: { contains: search, mode: 'insensitive' } },
    ];
  }
  if (status) where.status = status;

  const [accounts, total] = await Promise.all([
    prisma.appleAccount.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { apps: true } } },
    }),
    prisma.appleAccount.count({ where }),
  ]);

  return (
    <AccountsPageClient
      accounts={JSON.parse(JSON.stringify(accounts))}
      total={total}
      page={page}
      limit={limit}
      search={search}
      status={status}
    />
  );
}
