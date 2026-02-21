import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/utils';
import { getCurrentUser } from '@/lib/auth';
import { processResearchBatch } from '@/lib/research/engine';

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(_request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) return apiError('UNAUTHORIZED', 'Unauthorized', 401);

    const { id } = await params;

    const session = await prisma.researchSession.findUnique({ where: { id } });
    if (!session) return apiError('NOT_FOUND', 'Research session not found', 404);

    if (session.status !== 'PAUSED') {
      return apiError('VALIDATION_ERROR', 'Session is not paused', 400);
    }

    const updated = await prisma.researchSession.update({
      where: { id },
      data: { status: 'RUNNING' },
    });

    resumeResearch(id);

    return apiSuccess(updated);
  } catch {
    return apiError('INTERNAL_ERROR', 'Failed to resume session', 500);
  }
}

async function resumeResearch(sessionId: string) {
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
