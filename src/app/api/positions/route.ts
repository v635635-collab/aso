import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { apiSuccess, apiError, paginate } from '@/lib/utils';
import { paginationSchema } from '@/lib/validators';
import { z } from 'zod';

const querySchema = paginationSchema.extend({
  appId: z.string().optional(),
  keywordId: z.string().optional(),
  country: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return apiError('UNAUTHORIZED', 'Unauthorized', 401);

    const params = querySchema.parse(Object.fromEntries(req.nextUrl.searchParams));
    const { skip, take, page, limit } = paginate(params.page, params.limit);

    const where: Record<string, unknown> = {};
    if (params.appId) where.appId = params.appId;
    if (params.keywordId) where.keywordId = params.keywordId;
    if (params.country) where.country = params.country;

    if (params.from || params.to) {
      const capturedAt: Record<string, Date> = {};
      if (params.from) capturedAt.gte = new Date(params.from);
      if (params.to) capturedAt.lte = new Date(params.to);
      where.capturedAt = capturedAt;
    }

    const [snapshots, total] = await Promise.all([
      prisma.positionSnapshot.findMany({
        where,
        skip,
        take,
        orderBy: { capturedAt: 'desc' },
        include: {
          app: { select: { id: true, name: true, iconUrl: true } },
          keyword: { select: { id: true, text: true, trafficScore: true } },
        },
      }),
      prisma.positionSnapshot.count({ where }),
    ]);

    return apiSuccess(snapshots, { total, page, limit });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return apiError('INTERNAL_ERROR', message, 500);
  }
}
