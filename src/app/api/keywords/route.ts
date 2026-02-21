import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { apiSuccess, apiError, paginate } from '@/lib/utils';
import { getCurrentUser } from '@/lib/auth';
import { paginationSchema, searchSchema } from '@/lib/validators';
import { z } from 'zod';
import { calculateKeywordScore, calculateDifficulty } from '@/lib/optimization/keyword-scorer';

const keywordsFilterSchema = paginationSchema.merge(searchSchema).extend({
  nicheId: z.string().optional(),
  minTraffic: z.coerce.number().optional(),
  maxTraffic: z.coerce.number().optional(),
  intent: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return apiError('UNAUTHORIZED', 'Unauthorized', 401);

    const params = Object.fromEntries(request.nextUrl.searchParams);
    const filters = keywordsFilterSchema.parse(params);
    const { skip, take, page, limit } = paginate(filters.page, filters.limit);

    const where: Record<string, unknown> = {};

    if (filters.search) {
      where.OR = [
        { text: { contains: filters.search, mode: 'insensitive' } },
        { normalizedText: { contains: filters.search.toLowerCase(), mode: 'insensitive' } },
      ];
    }

    if (filters.nicheId) where.nicheId = filters.nicheId;
    if (filters.intent) where.intent = filters.intent;

    if (filters.minTraffic !== undefined || filters.maxTraffic !== undefined) {
      where.trafficScore = {};
      if (filters.minTraffic !== undefined) (where.trafficScore as Record<string, number>).gte = filters.minTraffic;
      if (filters.maxTraffic !== undefined) (where.trafficScore as Record<string, number>).lte = filters.maxTraffic;
    }

    if (filters.tags?.length) {
      where.tags = { hasSome: filters.tags };
    }

    const orderBy: Record<string, string> = {};
    if (filters.sortBy) {
      orderBy[filters.sortBy] = filters.sortOrder;
    } else {
      orderBy.createdAt = 'desc';
    }

    const [keywords, total] = await Promise.all([
      prisma.keyword.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          niche: { select: { id: true, name: true, displayName: true } },
          _count: { select: { appKeywords: true, suggestions: true } },
        },
      }),
      prisma.keyword.count({ where }),
    ]);

    return apiSuccess(keywords, { total, page, limit });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return apiError('VALIDATION_ERROR', 'Invalid parameters', 400, err.issues);
    }
    return apiError('INTERNAL_ERROR', 'Failed to fetch keywords', 500);
  }
}

const createKeywordSchema = z.object({
  keywords: z.array(z.object({
    text: z.string().min(1),
    locale: z.string().default('ru'),
    country: z.string().default('RU'),
    trafficScore: z.number().optional(),
    sap: z.number().optional(),
    competition: z.number().optional(),
    totalApps: z.number().optional(),
    nicheId: z.string().optional(),
    intent: z.enum(['NAVIGATIONAL', 'INFORMATIONAL', 'TRANSACTIONAL', 'MIXED']).optional(),
    tags: z.array(z.string()).optional(),
  })),
});

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return apiError('UNAUTHORIZED', 'Unauthorized', 401);

    const body = await request.json();
    const { keywords } = createKeywordSchema.parse(body);

    const created = [];

    for (const kw of keywords) {
      const normalizedText = kw.text.toLowerCase().trim();
      const difficulty = kw.trafficScore != null && kw.sap != null && kw.competition != null
        ? calculateDifficulty({
            trafficScore: kw.trafficScore,
            sap: kw.sap,
            competition: kw.competition,
            totalApps: kw.totalApps ?? 0,
          })
        : undefined;

      const keyword = await prisma.keyword.upsert({
        where: {
          normalizedText_locale_country: {
            normalizedText,
            locale: kw.locale ?? 'ru',
            country: kw.country ?? 'RU',
          },
        },
        update: {
          trafficScore: kw.trafficScore,
          sap: kw.sap,
          competition: kw.competition,
          totalApps: kw.totalApps,
          difficulty,
          intent: kw.intent,
          nicheId: kw.nicheId,
          tags: kw.tags ?? [],
          lastCheckedAt: kw.trafficScore != null ? new Date() : undefined,
        },
        create: {
          text: kw.text,
          normalizedText,
          locale: kw.locale ?? 'ru',
          country: kw.country ?? 'RU',
          trafficScore: kw.trafficScore,
          sap: kw.sap,
          competition: kw.competition,
          totalApps: kw.totalApps,
          difficulty,
          intent: kw.intent,
          nicheId: kw.nicheId,
          tags: kw.tags ?? [],
        },
      });

      created.push(keyword);
    }

    return apiSuccess(created);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return apiError('VALIDATION_ERROR', 'Invalid request body', 400, err.issues);
    }
    return apiError('INTERNAL_ERROR', 'Failed to create keywords', 500);
  }
}
