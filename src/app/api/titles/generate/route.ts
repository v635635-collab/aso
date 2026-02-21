import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { apiError } from '@/lib/utils';
import { generateTitleVariants } from '@/lib/optimization/title-generator';

const generateSchema = z.object({
  appId: z.string().min(1),
  maxVariants: z.number().int().min(1).max(10).default(3),
  strategy: z.enum(['traffic_first', 'balanced', 'readability_first']).default('balanced'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = generateSchema.parse(body);

    const job = await generateTitleVariants(data);

    return NextResponse.json(
      {
        success: true,
        data: { jobId: job.id, status: job.status },
      },
      { status: 202 },
    );
  } catch (err) {
    if (err instanceof z.ZodError) {
      return apiError('VALIDATION_ERROR', 'Invalid title generation parameters', 400, err.issues);
    }
    return apiError('INTERNAL_ERROR', 'Failed to start title generation', 500);
  }
}
