import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { apiSuccess, apiError, paginate } from '@/lib/utils';
import { paginationSchema } from '@/lib/validators';
import { z } from 'zod';

const querySchema = paginationSchema.extend({
  appId: z.string().optional(),
  type: z.enum(['POSITION_DROP', 'COMPLETE_DEINDEX', 'CATEGORY_DROP', 'REVIEW_BOMB', 'ACCOUNT_WARNING']).optional(),
  severity: z.enum(['MINOR', 'MODERATE', 'SEVERE', 'CRITICAL']).optional(),
  status: z.enum(['DETECTED', 'ANALYZING', 'MITIGATING', 'RESOLVED', 'ACCEPTED']).optional(),
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
    if (params.type) where.type = params.type;
    if (params.severity) where.severity = params.severity;
    if (params.status) where.status = params.status;

    if (params.from || params.to) {
      const detectedAt: Record<string, Date> = {};
      if (params.from) detectedAt.gte = new Date(params.from);
      if (params.to) detectedAt.lte = new Date(params.to);
      where.detectedAt = detectedAt;
    }

    const [events, total] = await Promise.all([
      prisma.pessimizationEvent.findMany({
        where,
        skip,
        take,
        orderBy: { detectedAt: 'desc' },
        include: {
          app: { select: { id: true, name: true, iconUrl: true } },
          campaign: { select: { id: true, name: true } },
        },
      }),
      prisma.pessimizationEvent.count({ where }),
    ]);

    return apiSuccess(events, { total, page, limit });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return apiError('INTERNAL_ERROR', message, 500);
  }
}
