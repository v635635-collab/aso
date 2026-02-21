import { NextRequest } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/utils';

const updateSchema = z.object({
  status: z.enum(['DRAFT', 'APPROVED', 'APPLIED', 'REJECTED', 'ARCHIVED']).optional(),
  notes: z.string().optional(),
  subtitle: z.string().max(30).optional(),
  tags: z.array(z.string()).optional(),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const variant = await prisma.titleVariant.findUnique({
      where: { id },
      include: {
        app: {
          select: {
            id: true, name: true, iconUrl: true, bundleId: true, currentTitle: true,
          },
        },
      },
    });

    if (!variant) return apiError('NOT_FOUND', 'Title variant not found', 404);
    return apiSuccess(variant);
  } catch {
    return apiError('INTERNAL_ERROR', 'Failed to fetch title variant', 500);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const data = updateSchema.parse(body);

    const existing = await prisma.titleVariant.findUnique({ where: { id } });
    if (!existing) return apiError('NOT_FOUND', 'Title variant not found', 404);

    const updated = await prisma.titleVariant.update({
      where: { id },
      data,
      include: {
        app: { select: { id: true, name: true, iconUrl: true, bundleId: true } },
      },
    });

    return apiSuccess(updated);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return apiError('VALIDATION_ERROR', 'Invalid update data', 400, err.issues);
    }
    return apiError('INTERNAL_ERROR', 'Failed to update title variant', 500);
  }
}
