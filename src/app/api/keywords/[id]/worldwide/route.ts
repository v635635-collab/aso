import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/utils';
import { getCurrentUser } from '@/lib/auth';

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) return apiError('UNAUTHORIZED', 'Unauthorized', 401);

    const { id } = await params;

    const keyword = await prisma.keyword.findUnique({ where: { id } });
    if (!keyword) return apiError('NOT_FOUND', 'Keyword not found', 404);

    const checks = await prisma.worldwideCheck.findMany({
      where: { keywordId: id },
      orderBy: [{ checkedAt: 'desc' }, { country: 'asc' }],
    });

    const latestByCountry = new Map<string, typeof checks[0]>();
    for (const check of checks) {
      if (!latestByCountry.has(check.country)) {
        latestByCountry.set(check.country, check);
      }
    }

    return apiSuccess({
      keyword: { id: keyword.id, text: keyword.text },
      countries: Array.from(latestByCountry.values()),
    });
  } catch {
    return apiError('INTERNAL_ERROR', 'Failed to fetch worldwide data', 500);
  }
}
