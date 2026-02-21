import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/utils';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const campaign = await prisma.pushCampaign.findUnique({ where: { id } });
    if (!campaign) return apiError('NOT_FOUND', 'Campaign not found', 404);

    const versions = await prisma.campaignVersion.findMany({
      where: { campaignId: id },
      orderBy: { version: 'desc' },
    });

    return apiSuccess(versions);
  } catch {
    return apiError('INTERNAL_ERROR', 'Failed to fetch versions', 500);
  }
}
