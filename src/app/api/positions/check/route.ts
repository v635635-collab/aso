import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { apiSuccess, apiError } from '@/lib/utils';
import { checkPositionManual } from '@/lib/monitoring/position-checker';
import { z } from 'zod';

const bodySchema = z.object({
  appId: z.string().min(1),
  keywordIds: z.array(z.string().min(1)).min(1).max(50),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return apiError('UNAUTHORIZED', 'Unauthorized', 401);

    const body = await req.json();
    const { appId, keywordIds } = bodySchema.parse(body);

    const snapshots = await checkPositionManual(appId, keywordIds);
    return apiSuccess(snapshots);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return apiError('VALIDATION_ERROR', 'Invalid request body', 400, error.issues);
    }
    const message = error instanceof Error ? error.message : 'Internal server error';
    return apiError('INTERNAL_ERROR', message, 500);
  }
}
