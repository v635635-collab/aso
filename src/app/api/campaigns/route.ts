import { NextRequest } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { apiSuccess, apiError, paginate } from '@/lib/utils';
import { paginationSchema } from '@/lib/validators';

const campaignCreateSchema = z.object({
  appId: z.string().min(1),
  name: z.string().min(1),
  strategy: z.enum(['GRADUAL', 'AGGRESSIVE', 'CONSERVATIVE', 'CUSTOM']).default('GRADUAL'),
  targetKeywords: z.array(z.string()).min(1),
  targetPositions: z.record(z.string(), z.number()).default({}),
  targetCountry: z.string().default('RU'),
  totalBudget: z.number().min(0).default(0),
  costPerInstall: z.number().min(0).optional(),
  totalInstalls: z.number().int().min(0).default(0),
  durationDays: z.number().int().min(1).default(14),
  startDate: z.string().datetime().optional(),
  tags: z.array(z.string()).default([]),
  notes: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const url = request.nextUrl.searchParams;
    const { page, limit } = paginationSchema.parse({
      page: url.get('page') ?? undefined,
      limit: url.get('limit') ?? undefined,
    });

    const appId = url.get('appId');
    const status = url.get('status');
    const dateFrom = url.get('dateFrom');
    const dateTo = url.get('dateTo');
    const search = url.get('search');

    const where: Record<string, unknown> = {};
    if (appId) where.appId = appId;
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { targetKeywords: { hasSome: [search] } },
      ];
    }
    if (dateFrom || dateTo) {
      where.createdAt = {
        ...(dateFrom && { gte: new Date(dateFrom) }),
        ...(dateTo && { lte: new Date(dateTo) }),
      };
    }

    const { skip, take } = paginate(page, limit);
    const [campaigns, total] = await Promise.all([
      prisma.pushCampaign.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          app: { select: { id: true, name: true, iconUrl: true, bundleId: true } },
          _count: { select: { dailyPlans: true, pessimizations: true } },
        },
      }),
      prisma.pushCampaign.count({ where }),
    ]);

    return apiSuccess(campaigns, { total, page, limit });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return apiError('VALIDATION_ERROR', 'Invalid query parameters', 400, err.issues);
    }
    return apiError('INTERNAL_ERROR', 'Failed to fetch campaigns', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = campaignCreateSchema.parse(body);

    const app = await prisma.app.findUnique({ where: { id: data.appId } });
    if (!app) return apiError('NOT_FOUND', 'App not found', 404);

    const campaign = await prisma.pushCampaign.create({
      data: {
        ...data,
        status: 'DRAFT',
        targetPositions: data.targetPositions as import('@prisma/client').Prisma.InputJsonValue,
        startDate: data.startDate ? new Date(data.startDate) : null,
      },
      include: {
        app: { select: { id: true, name: true, iconUrl: true, bundleId: true } },
      },
    });

    return apiSuccess(campaign);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return apiError('VALIDATION_ERROR', 'Invalid campaign data', 400, err.issues);
    }
    return apiError('INTERNAL_ERROR', 'Failed to create campaign', 500);
  }
}
