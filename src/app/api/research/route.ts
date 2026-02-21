import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { apiSuccess, apiError, paginate } from '@/lib/utils';
import { getCurrentUser } from '@/lib/auth';
import { paginationSchema } from '@/lib/validators';
import { startResearch, processResearchBatch } from '@/lib/research/engine';
import { z } from 'zod';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return apiError('UNAUTHORIZED', 'Unauthorized', 401);

    const params = Object.fromEntries(request.nextUrl.searchParams);
    const filters = paginationSchema.parse(params);
    const { skip, take, page, limit } = paginate(filters.page, filters.limit);

    const [sessions, total] = await Promise.all([
      prisma.researchSession.findMany({
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          niche: { select: { id: true, name: true, displayName: true } },
          _count: { select: { keywords: true } },
        },
      }),
      prisma.researchSession.count(),
    ]);

    return apiSuccess(sessions, { total, page, limit });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return apiError('VALIDATION_ERROR', 'Invalid parameters', 400, err.issues);
    }
    return apiError('INTERNAL_ERROR', 'Failed to fetch research sessions', 500);
  }
}

const createSchema = z.object({
  name: z.string().min(1).max(200),
  seedKeywords: z.array(z.string().min(1)).min(1).max(50),
  targetLocale: z.string().default('ru'),
  targetCountry: z.string().default('RU'),
  maxKeywords: z.number().min(10).max(5000).default(500),
  minTraffic: z.number().min(0).max(100).default(5),
  nicheId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return apiError('UNAUTHORIZED', 'Unauthorized', 401);

    const body = await request.json();
    const data = createSchema.parse(body);

    const session = await startResearch({
      ...data,
      triggeredBy: user.id,
    });

    runResearchAsync(session.id);

    return apiSuccess(session);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return apiError('VALIDATION_ERROR', 'Invalid request body', 400, err.issues);
    }
    return apiError('INTERNAL_ERROR', 'Failed to start research', 500);
  }
}

async function runResearchAsync(sessionId: string) {
  try {
    let isComplete = false;
    while (!isComplete) {
      const session = await prisma.researchSession.findUnique({ where: { id: sessionId } });
      if (!session || session.status === 'PAUSED' || session.status === 'FAILED') break;

      const result = await processResearchBatch(sessionId);
      isComplete = result.isComplete;
    }
  } catch (err) {
    await prisma.researchSession.update({
      where: { id: sessionId },
      data: {
        status: 'FAILED',
        errorMessage: err instanceof Error ? err.message : 'Unknown error',
      },
    });
  }
}
