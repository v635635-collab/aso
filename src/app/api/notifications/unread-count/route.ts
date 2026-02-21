import { apiSuccess, apiError } from '@/lib/utils';
import { getCurrentUser } from '@/lib/auth';
import { getUnreadCount } from '@/lib/notifications/service';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return apiError('UNAUTHORIZED', 'Not authenticated', 401);

    const count = await getUnreadCount(user.id);
    return apiSuccess({ count });
  } catch (error) {
    console.error('[API] GET /notifications/unread-count error:', error);
    return apiError('INTERNAL_ERROR', 'Failed to get unread count', 500);
  }
}
