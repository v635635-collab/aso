import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/utils';
import { getCurrentUser } from '@/lib/auth';
import { z } from 'zod';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getCurrentUser();
    if (!user) return apiError('UNAUTHORIZED', 'Authentication required', 401);

    const { id } = await params;

    const opportunity = await prisma.trendOpportunity.findUnique({
      where: { id },
    });

    if (!opportunity) return apiError('NOT_FOUND', 'Trend opportunity not found', 404);

    return apiSuccess(opportunity);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return apiError('INTERNAL_ERROR', message, 500);
  }
}

const patchSchema = z.object({
  status: z.enum(['NEW', 'REVIEWING', 'ACTIONABLE', 'ACTED_ON', 'DISMISSED', 'EXPIRED']),
  notes: z.string().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getCurrentUser();
    if (!user) return apiError('UNAUTHORIZED', 'Authentication required', 401);

    const { id } = await params;
    const body = await req.json();
    const { status, notes } = patchSchema.parse(body);

    const existing = await prisma.trendOpportunity.findUnique({ where: { id } });
    if (!existing) return apiError('NOT_FOUND', 'Trend opportunity not found', 404);

    const data: Record<string, unknown> = { status };
    if (notes !== undefined) data.notes = notes;

    const updated = await prisma.trendOpportunity.update({
      where: { id },
      data,
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
