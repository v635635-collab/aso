import { NextRequest } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { apiSuccess, apiError, paginate } from '@/lib/utils';
import { paginationSchema, searchSchema } from '@/lib/validators';

const appCreateSchema = z.object({
  appleId: z.string().min(1),
  bundleId: z.string().min(1),
  name: z.string().min(1),
  subtitle: z.string().optional(),
  currentTitle: z.string().optional(),
  currentSubtitle: z.string().optional(),
  type: z.enum(['NATIVE', 'WEBVIEW', 'HYBRID']).default('NATIVE'),
  category: z.string().optional(),
  subcategory: z.string().optional(),
  storeUrl: z.string().url().optional(),
  iconUrl: z.string().url().optional(),
  status: z.enum(['DRAFT', 'IN_REVIEW', 'LIVE', 'SUSPENDED', 'REMOVED']).default('DRAFT'),
  locale: z.string().default('ru'),
  country: z.string().default('RU'),
  accountId: z.string().min(1),
  nicheId: z.string().optional(),
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
    const { search, tags } = searchSchema.parse({
      search: url.get('search') ?? undefined,
      tags: url.get('tags') ?? undefined,
    });

    const status = url.get('status');
    const accountId = url.get('accountId');
    const nicheId = url.get('nicheId');

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { bundleId: { contains: search, mode: 'insensitive' } },
        { appleId: { contains: search, mode: 'insensitive' } },
        { currentTitle: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (status) where.status = status;
    if (accountId) where.accountId = accountId;
    if (nicheId) where.nicheId = nicheId;
    if (tags && tags.length > 0) where.tags = { hasSome: tags };

    const { skip, take } = paginate(page, limit);
    const [apps, total] = await Promise.all([
      prisma.app.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          account: { select: { id: true, email: true, teamName: true } },
          niche: { select: { id: true, name: true, displayName: true } },
          _count: { select: { keywords: true, pushCampaigns: true } },
        },
      }),
      prisma.app.count({ where }),
    ]);

    return apiSuccess(apps, { total, page, limit });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return apiError('VALIDATION_ERROR', 'Invalid query parameters', 400, err.issues);
    }
    return apiError('INTERNAL_ERROR', 'Failed to fetch apps', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = appCreateSchema.parse(body);

    const app = await prisma.app.create({
      data,
      include: {
        account: { select: { id: true, email: true, teamName: true } },
        niche: { select: { id: true, name: true, displayName: true } },
      },
    });

    return apiSuccess(app);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return apiError('VALIDATION_ERROR', 'Invalid app data', 400, err.issues);
    }
    const prismaErr = err as { code?: string };
    if (prismaErr.code === 'P2002') {
      return apiError('CONFLICT', 'App with this appleId or bundleId already exists', 409);
    }
    if (prismaErr.code === 'P2003') {
      return apiError('VALIDATION_ERROR', 'Invalid accountId or nicheId reference', 400);
    }
    return apiError('INTERNAL_ERROR', 'Failed to create app', 500);
  }
}
