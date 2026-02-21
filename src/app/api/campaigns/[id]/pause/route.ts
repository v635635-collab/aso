import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/utils';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const campaign = await prisma.pushCampaign.findUnique({ where: { id } });

    if (!campaign) return apiError('NOT_FOUND', 'Campaign not found', 404);
    if (campaign.status !== 'ACTIVE') {
      return apiError('BAD_REQUEST', `Cannot pause campaign in ${campaign.status} status`, 400);
    }

    const updated = await prisma.pushCampaign.update({
      where: { id },
      data: { status: 'PAUSED' },
      include: { app: { select: { id: true, name: true } } },
    });

    return apiSuccess(updated);
  } catch {
    return apiError('INTERNAL_ERROR', 'Failed to pause campaign', 500);
  }
}
