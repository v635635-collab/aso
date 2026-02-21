import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { apiSuccess, apiError, paginate } from '@/lib/utils';
import { paginationSchema } from '@/lib/validators';

export async function GET(request: NextRequest) {
  try {
    const url = request.nextUrl.searchParams;
    const { page, limit } = paginationSchema.parse({
      page: url.get('page') ?? undefined,
      limit: url.get('limit') ?? undefined,
    });

    const nicheSlug = url.get('nicheSlug');
    const outcome = url.get('outcome');
    const pessimized = url.get('pessimized');
    const strategy = url.get('strategy');

    const where: Record<string, unknown> = {};
    if (nicheSlug) where.nicheSlug = nicheSlug;
    if (outcome) where.outcome = outcome;
    if (pessimized !== null && pessimized !== undefined && pessimized !== '') {
      where.pessimized = pessimized === 'true';
    }
    if (strategy) where.pushStrategy = strategy;

    const { skip, take } = paginate(page, limit);
    const [records, total] = await Promise.all([
      prisma.pushLearningRecord.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.pushLearningRecord.count({ where }),
    ]);

    return apiSuccess(records, { total, page, limit });
  } catch {
    return apiError('INTERNAL_ERROR', 'Failed to fetch learning records', 500);
  }
}
