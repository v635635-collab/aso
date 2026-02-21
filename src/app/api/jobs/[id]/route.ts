import { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/lib/utils';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return apiError('UNAUTHORIZED', 'Not authenticated', 401);

    const { id } = await params;
    if (!id) return apiError('VALIDATION_ERROR', 'Job ID required', 400);

    const job = await prisma.asyncJob.findUnique({ where: { id } });
    if (!job) return apiError('NOT_FOUND', `Job ${id} not found`, 404);

    return apiSuccess(job);
  } catch (error) {
    console.error('[API] GET /jobs/[id] error:', error);
    return apiError('INTERNAL_ERROR', 'Failed to fetch job', 500);
  }
}
