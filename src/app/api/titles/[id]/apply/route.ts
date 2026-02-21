import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/utils';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const variant = await prisma.titleVariant.findUnique({ where: { id } });
    if (!variant) return apiError('NOT_FOUND', 'Title variant not found', 404);

    if (variant.status === 'REJECTED' || variant.status === 'ARCHIVED') {
      return apiError('BAD_REQUEST', `Cannot apply a ${variant.status.toLowerCase()} variant`, 400);
    }

    await prisma.$transaction(async (tx) => {
      await tx.titleVariant.updateMany({
        where: { appId: variant.appId, isActive: true, id: { not: id } },
        data: { isActive: false, status: 'ARCHIVED' },
      });

      await tx.titleVariant.update({
        where: { id },
        data: { isActive: true, status: 'APPLIED', appliedAt: new Date() },
      });

      await tx.app.update({
        where: { id: variant.appId },
        data: { currentTitle: variant.title, currentSubtitle: variant.subtitle },
      });
    });

    const updated = await prisma.titleVariant.findUnique({
      where: { id },
      include: {
        app: { select: { id: true, name: true, iconUrl: true, bundleId: true } },
      },
    });

    return apiSuccess(updated);
  } catch {
    return apiError('INTERNAL_ERROR', 'Failed to apply title variant', 500);
  }
}
