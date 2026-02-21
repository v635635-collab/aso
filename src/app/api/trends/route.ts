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
    const category = searchParams.get('category') || undefined;
    const geo = searchParams.get('geo') || undefined;
    const isBreakout = searchParams.get('isBreakout');

    const where: Record<string, unknown> = {};
    if (category) where.category = category;
    if (geo) where.geo = geo;
    if (isBreakout === 'true') where.isBreakout = true;

    const [data, total] = await Promise.all([
      prisma.trendSnapshot.findMany({
        where,
        orderBy: { capturedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.trendSnapshot.count({ where }),
    ]);

    return apiSuccess(data, { total, page, limit });
  } catch (error) {
    console.error('[API] GET /trends error:', error);
    return apiError('INTERNAL_ERROR', 'Failed to fetch trends', 500);
  }
}
