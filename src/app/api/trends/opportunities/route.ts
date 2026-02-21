import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/utils';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return apiError('UNAUTHORIZED', 'Authentication required', 401);

    const { searchParams } = request.nextUrl;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const status = searchParams.get('status') || undefined;
    const category = searchParams.get('category') || undefined;

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (category) where.trendCategory = category;

    const [data, total] = await Promise.all([
      prisma.trendOpportunity.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.trendOpportunity.count({ where }),
    ]);

    return apiSuccess(data, { total, page, limit });
  } catch (error) {
    console.error('[API] GET /trends/opportunities error:', error);
    return apiError('INTERNAL_ERROR', 'Failed to fetch opportunities', 500);
  }
}
