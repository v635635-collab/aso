import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { apiSuccess, apiError } from '@/lib/utils';
import { z } from 'zod';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getCurrentUser();
    if (!user) return apiError('UNAUTHORIZED', 'Unauthorized', 401);

    const { id } = await params;

    const event = await prisma.pessimizationEvent.findUnique({
      where: { id },
      include: {
        app: { select: { id: true, name: true, iconUrl: true, bundleId: true, category: true } },
        campaign: { select: { id: true, name: true, strategy: true, status: true, totalInstalls: true } },
      },
    });

    if (!event) return apiError('NOT_FOUND', 'Pessimization event not found', 404);

    const relatedJob = await prisma.asyncJob.findFirst({
      where: {
        type: 'PESSIMIZATION_ANALYSIS',
        relatedEntityType: 'PessimizationEvent',
        relatedEntityId: id,
      },
      orderBy: { createdAt: 'desc' },
      select: { id: true, status: true, output: true, createdAt: true, completedAt: true },
    });

    return apiSuccess({ ...event, analysisJob: relatedJob });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return apiError('INTERNAL_ERROR', message, 500);
  }
}

const patchSchema = z.object({
  status: z.enum(['RESOLVED', 'ACCEPTED', 'MITIGATING']),
  notes: z.string().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getCurrentUser();
    if (!user) return apiError('UNAUTHORIZED', 'Unauthorized', 401);

    const { id } = await params;
    const body = await req.json();
    const { status, notes } = patchSchema.parse(body);

    const existing = await prisma.pessimizationEvent.findUnique({ where: { id } });
    if (!existing) return apiError('NOT_FOUND', 'Pessimization event not found', 404);

    const data: Record<string, unknown> = { status };
    if (status === 'RESOLVED') data.resolvedAt = new Date();
    if (notes !== undefined) data.notes = notes;

    const updated = await prisma.pessimizationEvent.update({
      where: { id },
      data,
      include: {
        app: { select: { id: true, name: true } },
      },
    });

    return apiSuccess(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return apiError('VALIDATION_ERROR', 'Invalid request body', 400, error.issues);
    }
    const message = error instanceof Error ? error.message : 'Internal server error';
    return apiError('INTERNAL_ERROR', message, 500);
  }
}
