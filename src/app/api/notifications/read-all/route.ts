import { apiSuccess, apiError } from '@/lib/utils';
import { getCurrentUser } from '@/lib/auth';
import { markAllAsRead } from '@/lib/notifications/service';

export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user) return apiError('UNAUTHORIZED', 'Not authenticated', 401);

    await markAllAsRead(user.id);
    return apiSuccess({ success: true });
  } catch (error) {
    console.error('[API] POST /notifications/read-all error:', error);
    return apiError('INTERNAL_ERROR', 'Failed to mark all as read', 500);
  }
}
