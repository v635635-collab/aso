import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { apiError } from '@/lib/utils';
import { generatePushPlan } from '@/lib/push/plan-generator';

const generateSchema = z.object({
  appId: z.string().min(1),
  targetKeywords: z.array(z.string()).min(1),
  strategy: z.enum(['GRADUAL', 'AGGRESSIVE', 'CONSERVATIVE', 'CUSTOM']).default('GRADUAL'),
  durationDays: z.number().int().min(1).max(90).optional(),
  totalBudget: z.number().min(0).optional(),
  costPerInstall: z.number().min(0).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = generateSchema.parse(body);

    const job = await generatePushPlan(data);

    return NextResponse.json(
      {
        success: true,
        data: { jobId: job.id, status: job.status },
      },
      { status: 202 }
    );
  } catch (err) {
    if (err instanceof z.ZodError) {
      return apiError('VALIDATION_ERROR', 'Invalid plan generation parameters', 400, err.issues);
    }
    return apiError('INTERNAL_ERROR', 'Failed to start plan generation', 500);
  }
}
