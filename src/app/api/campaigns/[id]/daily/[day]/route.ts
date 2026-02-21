import { NextRequest } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/utils';

const dailyUpdateSchema = z.object({
  actualInstalls: z.number().int().min(0).optional(),
  cost: z.number().min(0).optional(),
  status: z.enum(['PENDING', 'SENT', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED', 'FAILED']).optional(),
  notes: z.string().optional(),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; day: string }> }
) {
  try {
    const { id, day } = await params;
    const dayNum = parseInt(day, 10);
    if (isNaN(dayNum)) return apiError('VALIDATION_ERROR', 'Invalid day number', 400);

    const plan = await prisma.pushDailyPlan.findUnique({
      where: { campaignId_day: { campaignId: id, day: dayNum } },
    });

    if (!plan) return apiError('NOT_FOUND', 'Daily plan not found', 404);
    return apiSuccess(plan);
  } catch {
    return apiError('INTERNAL_ERROR', 'Failed to fetch daily plan', 500);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; day: string }> }
) {
  try {
    const { id, day } = await params;
    const dayNum = parseInt(day, 10);
    if (isNaN(dayNum)) return apiError('VALIDATION_ERROR', 'Invalid day number', 400);

    const body = await request.json();
    const data = dailyUpdateSchema.parse(body);

    const plan = await prisma.pushDailyPlan.findUnique({
      where: { campaignId_day: { campaignId: id, day: dayNum } },
    });
    if (!plan) return apiError('NOT_FOUND', 'Daily plan not found', 404);

    const updated = await prisma.pushDailyPlan.update({
      where: { id: plan.id },
      data,
    });

    if (data.actualInstalls !== undefined || data.cost !== undefined) {
      const allPlans = await prisma.pushDailyPlan.findMany({
        where: { campaignId: id },
      });
      const totalActual = allPlans.reduce((s, p) => s + p.actualInstalls, 0);
      const totalSpent = allPlans.reduce((s, p) => s + p.cost, 0);

      await prisma.pushCampaign.update({
        where: { id },
        data: { completedInstalls: totalActual, spentBudget: totalSpent },
      });
    }

    return apiSuccess(updated);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return apiError('VALIDATION_ERROR', 'Invalid update data', 400, err.issues);
    }
    return apiError('INTERNAL_ERROR', 'Failed to update daily plan', 500);
  }
}
