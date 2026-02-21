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
    const [keywords, total] = await Promise.all([
      prisma.appKeyword.findMany({
        where: { appId: id },
        skip,
        take,
        orderBy: [{ currentPosition: 'asc' }],
        include: {
          keyword: {
            select: { id: true, text: true, trafficScore: true, sap: true, competition: true },
          },
        },
      }),
      prisma.appKeyword.count({ where: { appId: id } }),
    ]);

    return apiSuccess(keywords, { total, page, limit });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return apiError('VALIDATION_ERROR', 'Invalid query parameters', 400, err.issues);
    }
    return apiError('INTERNAL_ERROR', 'Failed to fetch app keywords', 500);
  }
}
