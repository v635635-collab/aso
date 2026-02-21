import { NextRequest } from 'next/server';
import { z } from 'zod';
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

    const appId = url.get('appId');
    const status = url.get('status');
    const search = url.get('search');

    const validStatuses = ['DRAFT', 'APPROVED', 'APPLIED', 'REJECTED', 'ARCHIVED'];
    const where: Record<string, unknown> = {};
    if (appId) where.appId = appId;
    if (status && validStatuses.includes(status)) where.status = status;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { keywordsCovered: { hasSome: [search] } },
      ];
    }

    const { skip, take } = paginate(page, limit);
    const [variants, total] = await Promise.all([
      prisma.titleVariant.findMany({
        where,
        skip,
        take,
        orderBy: [{ score: 'desc' }, { createdAt: 'desc' }],
        include: {
          app: { select: { id: true, name: true, iconUrl: true, bundleId: true } },
        },
      }),
      prisma.titleVariant.count({ where }),
    ]);

    return apiSuccess(variants, { total, page, limit });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return apiError('VALIDATION_ERROR', 'Invalid query parameters', 400, err.issues);
    }
    return apiError('INTERNAL_ERROR', 'Failed to fetch title variants', 500);
  }
}
