import { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/lib/utils';
import { getCurrentUser } from '@/lib/auth';
import { getSetting } from '@/lib/settings/service';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return apiError('UNAUTHORIZED', 'Not authenticated', 401);

    const { key } = await params;
    if (!key) return apiError('VALIDATION_ERROR', 'Setting key required', 400);

    const value = await getSetting(key);
    if (value === null) {
      return apiError('NOT_FOUND', `Setting "${key}" not found`, 404);
    }

    return apiSuccess({ key, value });
  } catch (error) {
    console.error('[API] GET /settings/[key] error:', error);
    return apiError('INTERNAL_ERROR', 'Failed to fetch setting', 500);
  }
}
