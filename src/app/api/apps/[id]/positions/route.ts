import { NextRequest } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { apiSuccess, apiError, paginate } from '@/lib/utils';
import { paginationSchema } from '@/lib/validators';

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const url = request.nextUrl.searchParams;
    const { page, limit } = paginationSchema.parse({
      page: url.get('page'),
      limit: url.get('limit'),
    });

    const from = url.get('from');
    const to = url.get('to');

    const app = await prisma.app.findUnique({ where: { id }, select: { id: true } });
    if (!app) {
      return apiError('NOT_FOUND', 'App not found', 404);
    }

    const where: Record<string, unknown> = { appId: id };
    if (from || to) {
      const capturedAt: Record<string, Date> = {};
      if (from) capturedAt.gte = new Date(from);
      if (to) capturedAt.lte = new Date(to);
      where.capturedAt = capturedAt;
    }

    const { skip, take } = paginate(page, limit);
    const [snapshots, total] = await Promise.all([
      prisma.positionSnapshot.findMany({
        where,
        skip,
        take,
        orderBy: { capturedAt: 'desc' },
        include: {
          keyword: { select: { id: true, text: true, trafficScore: true } },
        },
      }),
      prisma.positionSnapshot.count({ where }),
    ]);

    return apiSuccess(snapshots, { total, page, limit });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return apiError('VALIDATION_ERROR', 'Invalid query parameters', 400, err.issues);
    }
    return apiError('INTERNAL_ERROR', 'Failed to fetch position history', 500);
  }
}
