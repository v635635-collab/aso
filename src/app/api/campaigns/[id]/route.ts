import { NextRequest } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/utils';

const campaignUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  strategy: z.enum(['GRADUAL', 'AGGRESSIVE', 'CONSERVATIVE', 'CUSTOM']).optional(),
  targetKeywords: z.array(z.string()).optional(),
  totalBudget: z.number().min(0).optional(),
  costPerInstall: z.number().min(0).optional(),
  totalInstalls: z.number().int().min(0).optional(),
  durationDays: z.number().int().min(1).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const campaign = await prisma.pushCampaign.findUnique({
      where: { id },
      include: {
        app: { select: { id: true, name: true, iconUrl: true, bundleId: true, categoryRank: true, organicDownloads: true } },
        dailyPlans: { orderBy: { day: 'asc' } },
        pessimizations: { orderBy: { detectedAt: 'desc' }, take: 5 },
        versions: { orderBy: { version: 'desc' }, take: 10 },
        _count: { select: { dailyPlans: true, pessimizations: true, versions: true } },
      },
    });

    if (!campaign) return apiError('NOT_FOUND', 'Campaign not found', 404);
    return apiSuccess(campaign);
  } catch {
    return apiError('INTERNAL_ERROR', 'Failed to fetch campaign', 500);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const data = campaignUpdateSchema.parse(body);

    const campaign = await prisma.pushCampaign.findUnique({ where: { id } });
    if (!campaign) return apiError('NOT_FOUND', 'Campaign not found', 404);

    if (!['DRAFT', 'REVIEW'].includes(campaign.status)) {
      return apiError('BAD_REQUEST', `Cannot edit campaign in ${campaign.status} status`, 400);
    }

    const updated = await prisma.pushCampaign.update({
      where: { id },
      data: {
        ...data,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
      },
      include: {
        app: { select: { id: true, name: true, iconUrl: true, bundleId: true } },
        dailyPlans: { orderBy: { day: 'asc' } },
      },
    });

    return apiSuccess(updated);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return apiError('VALIDATION_ERROR', 'Invalid update data', 400, err.issues);
    }
    return apiError('INTERNAL_ERROR', 'Failed to update campaign', 500);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const campaign = await prisma.pushCampaign.findUnique({ where: { id } });
    if (!campaign) return apiError('NOT_FOUND', 'Campaign not found', 404);

    if (['ACTIVE'].includes(campaign.status)) {
      return apiError('BAD_REQUEST', 'Cannot delete an active campaign. Pause or cancel it first.', 400);
    }

    await prisma.pushCampaign.delete({ where: { id } });
    return apiSuccess({ deleted: true });
  } catch {
    return apiError('INTERNAL_ERROR', 'Failed to delete campaign', 500);
  }
}
