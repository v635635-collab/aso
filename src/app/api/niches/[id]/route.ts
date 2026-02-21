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

    const niche = await prisma.niche.findUnique({
      where: { id },
      include: {
        keywords: {
          orderBy: { trafficScore: 'desc' },
          take: 100,
          select: {
            id: true,
            text: true,
            trafficScore: true,
            sap: true,
            competition: true,
            difficulty: true,
            intent: true,
            tags: true,
            lastCheckedAt: true,
          },
        },
        apps: {
          select: {
            id: true,
            name: true,
            iconUrl: true,
            status: true,
            organicDownloads: true,
            categoryRank: true,
          },
        },
        parent: { select: { id: true, name: true, displayName: true } },
        children: { select: { id: true, name: true, displayName: true } },
        _count: { select: { keywords: true, apps: true, researchSessions: true } },
      },
    });

    if (!niche) return apiError('NOT_FOUND', 'Niche not found', 404);

    return apiSuccess(niche);
  } catch {
    return apiError('INTERNAL_ERROR', 'Failed to fetch niche', 500);
  }
}

const updateSchema = z.object({
  displayName: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  riskLevel: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().nullable().optional(),
  parentId: z.string().nullable().optional(),
});

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) return apiError('UNAUTHORIZED', 'Unauthorized', 401);

    const { id } = await params;
    const body = await request.json();
    const data = updateSchema.parse(body);

    const niche = await prisma.niche.update({
      where: { id },
      data,
      include: { _count: { select: { keywords: true, apps: true } } },
    });

    return apiSuccess(niche);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return apiError('VALIDATION_ERROR', 'Invalid request body', 400, err.issues);
    }
    return apiError('INTERNAL_ERROR', 'Failed to update niche', 500);
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) return apiError('UNAUTHORIZED', 'Unauthorized', 401);

    const { id } = await params;

    await prisma.keyword.updateMany({
      where: { nicheId: id },
      data: { nicheId: null },
    });

    await prisma.niche.delete({ where: { id } });

    return apiSuccess({ deleted: true });
  } catch {
    return apiError('INTERNAL_ERROR', 'Failed to delete niche', 500);
  }
}
