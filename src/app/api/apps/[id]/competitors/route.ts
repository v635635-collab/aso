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

    const app = await prisma.app.findUnique({ where: { id }, select: { id: true } });
    if (!app) {
      return apiError('NOT_FOUND', 'App not found', 404);
    }

    const { skip, take } = paginate(page, limit);
    const [competitors, total] = await Promise.all([
      prisma.competitorRelation.findMany({
        where: { appId: id },
        skip,
        take,
        orderBy: { sharedKeywords: 'desc' },
        include: {
          competitor: {
            select: {
              id: true, appleId: true, name: true, publisher: true,
              iconUrl: true, rating: true, reviewCount: true, estimatedDownloads: true,
            },
          },
        },
      }),
      prisma.competitorRelation.count({ where: { appId: id } }),
    ]);

    return apiSuccess(competitors, { total, page, limit });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return apiError('VALIDATION_ERROR', 'Invalid query parameters', 400, err.issues);
    }
    return apiError('INTERNAL_ERROR', 'Failed to fetch competitors', 500);
  }
}
