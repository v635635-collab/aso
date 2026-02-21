import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import { AccountDetailClient } from './page-client';

export default async function AccountDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const account = await prisma.appleAccount.findUnique({
    where: { id },
    include: {
      apps: {
        orderBy: { name: 'asc' },
        select: {
          id: true, name: true, bundleId: true, status: true,
          iconUrl: true, organicDownloads: true, categoryRank: true, rating: true,
        },
      },
      _count: { select: { apps: true } },
    },
  });

  if (!account) notFound();

  return <AccountDetailClient account={JSON.parse(JSON.stringify(account))} />;
}
