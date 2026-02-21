import { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/lib/utils';
import { getCurrentUser } from '@/lib/auth';
import { markAsRead } from '@/lib/notifications/service';

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return apiError('UNAUTHORIZED', 'Not authenticated', 401);

    const { id } = await params;
    if (!id) return apiError('VALIDATION_ERROR', 'Notification ID required', 400);

    await markAsRead(id);
    return apiSuccess({ id, isRead: true });
  } catch (error) {
    console.error('[API] PATCH /notifications/[id]/read error:', error);
    return apiError('INTERNAL_ERROR', 'Failed to mark notification as read', 500);
  }
}
