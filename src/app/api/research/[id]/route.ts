import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/utils';
import { getCurrentUser } from '@/lib/auth';

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) return apiError('UNAUTHORIZED', 'Unauthorized', 401);

    const { id } = await params;

    const session = await prisma.researchSession.findUnique({
      where: { id },
      include: {
        niche: { select: { id: true, name: true, displayName: true } },
        keywords: {
          include: {
            keyword: {
              select: {
                id: true,
                text: true,
                trafficScore: true,
                sap: true,
                competition: true,
                difficulty: true,
                intent: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!session) return apiError('NOT_FOUND', 'Research session not found', 404);

    const progress = session.totalSeeds > 0
      ? Math.round((session.processedSeeds / session.totalSeeds) * 100)
      : 0;

    return apiSuccess({ ...session, progress });
  } catch {
    return apiError('INTERNAL_ERROR', 'Failed to fetch research session', 500);
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) return apiError('UNAUTHORIZED', 'Unauthorized', 401);

    const { id } = await params;

    const session = await prisma.researchSession.findUnique({ where: { id } });
    if (!session) return apiError('NOT_FOUND', 'Research session not found', 404);

    if (session.status === 'RUNNING') {
      await prisma.researchSession.update({
        where: { id },
        data: { status: 'FAILED', errorMessage: 'Cancelled by user' },
      });
    }

    await prisma.researchKeyword.deleteMany({ where: { sessionId: id } });
    await prisma.researchSession.delete({ where: { id } });

    return apiSuccess({ deleted: true });
  } catch {
    return apiError('INTERNAL_ERROR', 'Failed to delete research session', 500);
  }
}
