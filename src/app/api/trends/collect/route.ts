import { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/lib/utils';
import { getCurrentUser } from '@/lib/auth';

export async function POST(_req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return apiError('UNAUTHORIZED', 'Authentication required', 401);

    return apiSuccess({ message: 'Trend collection triggered', status: 'queued' });
  } catch (error) {
    console.error('[API] POST /trends/collect error:', error);
    return apiError('INTERNAL_ERROR', 'Failed to trigger trend collection', 500);
  }
}
