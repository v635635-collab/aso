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

    const canStart = campaign.status === 'APPROVED' || campaign.status === 'PAUSED';
    if (!canStart) {
      return apiError('BAD_REQUEST', `Cannot start campaign from ${campaign.status} status`, 400);
    }

    const now = new Date();
    const updateData: Record<string, unknown> = { status: 'ACTIVE' };

    if (campaign.status === 'APPROVED' && !campaign.startDate) {
      updateData.startDate = now;
      const endDate = new Date(now);
      endDate.setDate(endDate.getDate() + campaign.durationDays);
      updateData.endDate = endDate;
    }

    const updated = await prisma.pushCampaign.update({
      where: { id },
      data: updateData,
      include: {
        app: { select: { id: true, name: true } },
        dailyPlans: { orderBy: { day: 'asc' } },
      },
    });

    return apiSuccess(updated);
  } catch {
    return apiError('INTERNAL_ERROR', 'Failed to start campaign', 500);
  }
}
