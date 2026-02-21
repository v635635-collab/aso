import { apiSuccess, apiError } from '@/lib/utils';
import { getCurrentUser } from '@/lib/auth';
import { seedDefaultSettings } from '@/lib/settings/service';

export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user) return apiError('UNAUTHORIZED', 'Not authenticated', 401);
    if (user.role !== 'ADMIN') return apiError('FORBIDDEN', 'Admin access required', 403);

    const result = await seedDefaultSettings();
    return apiSuccess(result);
  } catch (error) {
    console.error('[API] POST /settings/seed error:', error);
    return apiError('INTERNAL_ERROR', 'Failed to seed settings', 500);
  }
}
