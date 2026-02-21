import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { apiSuccess, apiError, paginate } from '@/lib/utils';
import { getCurrentUser } from '@/lib/auth';
import { paginationSchema, searchSchema } from '@/lib/validators';
import { z } from 'zod';

const nichesFilterSchema = paginationSchema.merge(searchSchema).extend({
  riskLevel: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return apiError('UNAUTHORIZED', 'Unauthorized', 401);

    const params = Object.fromEntries(request.nextUrl.searchParams);
    const filters = nichesFilterSchema.parse(params);
    const { skip, take, page, limit } = paginate(filters.page, filters.limit);

    const where: Record<string, unknown> = {};

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { displayName: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters.riskLevel) where.riskLevel = filters.riskLevel;

    const orderBy: Record<string, string> = {};
    if (filters.sortBy) {
      orderBy[filters.sortBy] = filters.sortOrder;
    } else {
      orderBy.createdAt = 'desc';
    }

    const [niches, total] = await Promise.all([
      prisma.niche.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          _count: { select: { keywords: true, apps: true } },
        },
      }),
      prisma.niche.count({ where }),
    ]);

    return apiSuccess(niches, { total, page, limit });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return apiError('VALIDATION_ERROR', 'Invalid parameters', 400, err.issues);
    }
    return apiError('INTERNAL_ERROR', 'Failed to fetch niches', 500);
  }
}

const createNicheSchema = z.object({
  name: z.string().min(1).max(100),
  displayName: z.string().min(1).max(200),
  description: z.string().optional(),
  parentId: z.string().optional(),
  riskLevel: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('MEDIUM'),
  tags: z.array(z.string()).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return apiError('UNAUTHORIZED', 'Unauthorized', 401);

    const body = await request.json();
    const data = createNicheSchema.parse(body);

    const existing = await prisma.niche.findUnique({ where: { name: data.name } });
    if (existing) {
      return apiError('CONFLICT', 'Niche with this name already exists', 409);
    }

    const niche = await prisma.niche.create({
      data: {
        name: data.name,
        displayName: data.displayName,
        description: data.description,
        parentId: data.parentId,
        riskLevel: data.riskLevel,
        tags: data.tags ?? [],
      },
      include: {
        _count: { select: { keywords: true, apps: true } },
      },
    });

    return apiSuccess(niche);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return apiError('VALIDATION_ERROR', 'Invalid request body', 400, err.issues);
    }
    return apiError('INTERNAL_ERROR', 'Failed to create niche', 500);
  }
}
