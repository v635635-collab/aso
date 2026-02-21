import { NextRequest } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/utils';
import { exportCampaignPlan } from '@/lib/push/exporter';

const exportSchema = z.object({
  format: z.enum(['text', 'csv', 'json']).default('text'),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { format } = exportSchema.parse(body);

    const campaign = await prisma.pushCampaign.findUnique({
      where: { id },
      include: { dailyPlans: { orderBy: { day: 'asc' } } },
    });

    if (!campaign) return apiError('NOT_FOUND', 'Campaign not found', 404);

    const exported = exportCampaignPlan(campaign, format);
    return apiSuccess({ format, content: exported });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return apiError('VALIDATION_ERROR', 'Invalid export format', 400, err.issues);
    }
    return apiError('INTERNAL_ERROR', 'Failed to export campaign', 500);
  }
}
