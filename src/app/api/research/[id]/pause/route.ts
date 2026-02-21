import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/utils';
import { getCurrentUser } from '@/lib/auth';

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(_request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) return apiError('UNAUTHORIZED', 'Unauthorized', 401);

    const { id } = await params;

    const session = await prisma.researchSession.findUnique({ where: { id } });
    if (!session) return apiError('NOT_FOUND', 'Research session not found', 404);

    if (session.status !== 'RUNNING') {
      return apiError('VALIDATION_ERROR', 'Session is not running', 400);
    }

    const updated = await prisma.researchSession.update({
      where: { id },
      data: { status: 'PAUSED' },
    });

    return apiSuccess(updated);
  } catch {
    return apiError('INTERNAL_ERROR', 'Failed to pause session', 500);
  }
}
