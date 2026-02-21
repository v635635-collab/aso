import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/utils';
import { getCurrentUser } from '@/lib/auth';
import { z } from 'zod';

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) return apiError('UNAUTHORIZED', 'Unauthorized', 401);

    const { id } = await params;

    const keyword = await prisma.keyword.findUnique({
      where: { id },
      include: {
        niche: { select: { id: true, name: true, displayName: true } },
        metrics: {
          orderBy: { capturedAt: 'desc' },
          take: 30,
        },
        appKeywords: {
          include: {
            app: { select: { id: true, name: true, iconUrl: true, status: true } },
          },
        },
        suggestions: {
          include: {
            suggestedKeyword: {
              select: { id: true, text: true, trafficScore: true, sap: true },
            },
          },
          take: 20,
        },
        _count: { select: { worldwideChecks: true, researchKeywords: true } },
      },
    });

    if (!keyword) return apiError('NOT_FOUND', 'Keyword not found', 404);

    return apiSuccess(keyword);
  } catch {
    return apiError('INTERNAL_ERROR', 'Failed to fetch keyword', 500);
  }
}

const updateSchema = z.object({
  tags: z.array(z.string()).optional(),
  nicheId: z.string().nullable().optional(),
  intent: z.enum(['NAVIGATIONAL', 'INFORMATIONAL', 'TRANSACTIONAL', 'MIXED']).nullable().optional(),
  notes: z.string().nullable().optional(),
});

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) return apiError('UNAUTHORIZED', 'Unauthorized', 401);

    const { id } = await params;
    const body = await request.json();
    const data = updateSchema.parse(body);

    const keyword = await prisma.keyword.update({
      where: { id },
      data,
      include: {
        niche: { select: { id: true, name: true, displayName: true } },
      },
    });

    return apiSuccess(keyword);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return apiError('VALIDATION_ERROR', 'Invalid request body', 400, err.issues);
    }
    return apiError('INTERNAL_ERROR', 'Failed to update keyword', 500);
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) return apiError('UNAUTHORIZED', 'Unauthorized', 401);

    const { id } = await params;

    await prisma.keyword.delete({ where: { id } });

    return apiSuccess({ deleted: true });
  } catch {
    return apiError('INTERNAL_ERROR', 'Failed to delete keyword', 500);
  }
}
