import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/utils';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const campaign = await prisma.pushCampaign.findUnique({
      where: { id },
      include: { dailyPlans: true },
    });

    if (!campaign) return apiError('NOT_FOUND', 'Campaign not found', 404);
    if (campaign.status !== 'DRAFT') {
      return apiError('BAD_REQUEST', `Cannot submit for review from ${campaign.status} status`, 400);
    }
    if (campaign.dailyPlans.length === 0) {
      return apiError('BAD_REQUEST', 'Campaign must have daily plans before review', 400);
    }

    const lastVersion = await prisma.campaignVersion.findFirst({
      where: { campaignId: id },
      orderBy: { version: 'desc' },
    });

    const [updated] = await prisma.$transaction([
      prisma.pushCampaign.update({
        where: { id },
        data: { status: 'REVIEW' },
        include: { app: { select: { id: true, name: true } } },
      }),
      prisma.campaignVersion.create({
        data: {
          campaignId: id,
          version: (lastVersion?.version ?? 0) + 1,
          snapshot: JSON.parse(JSON.stringify(campaign)),
          dailyPlans: JSON.parse(JSON.stringify(campaign.dailyPlans)),
          changeDescription: 'Submitted for review',
          changedBy: 'system',
          status: 'REVIEW',
        },
      }),
    ]);

    return apiSuccess(updated);
  } catch {
    return apiError('INTERNAL_ERROR', 'Failed to submit for review', 500);
  }
}
