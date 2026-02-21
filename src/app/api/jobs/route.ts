import { NextRequest } from 'next/server';
import { z } from 'zod';
import { apiSuccess, apiError, paginate } from '@/lib/utils';
import { paginationSchema } from '@/lib/validators';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/prisma';

const querySchema = paginationSchema.extend({
  type: z.string().optional(),
  status: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return apiError('UNAUTHORIZED', 'Not authenticated', 401);

    const params = Object.fromEntries(request.nextUrl.searchParams);
    const parsed = querySchema.safeParse(params);
    if (!parsed.success) {
      return apiError('VALIDATION_ERROR', 'Invalid query parameters', 400, parsed.error.flatten());
    }

    const { page, limit, type, status } = parsed.data;
    const { skip, take, page: safePage, limit: safeLimit } = paginate(page, limit);

    const where: Record<string, unknown> = {};
    if (type) where.type = type;
    if (status) where.status = status;

    const [items, total] = await Promise.all([
      prisma.asyncJob.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.asyncJob.count({ where }),
    ]);

    return apiSuccess(items, { total, page: safePage, limit: safeLimit });
  } catch (error) {
    console.error('[API] GET /jobs error:', error);
    return apiError('INTERNAL_ERROR', 'Failed to fetch jobs', 500);
  }
}
