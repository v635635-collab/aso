import { NextRequest } from 'next/server';
import { z } from 'zod';
import { apiSuccess, apiError, paginate } from '@/lib/utils';
import { paginationSchema } from '@/lib/validators';
import { getCurrentUser } from '@/lib/auth';
import { listNotifications } from '@/lib/notifications/service';

const querySchema = paginationSchema.extend({
  isRead: z.enum(['true', 'false']).optional().transform((v) => (v === undefined ? undefined : v === 'true')),
  type: z.string().optional(),
  severity: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return apiError('UNAUTHORIZED', 'Not authenticated', 401);

    const params = Object.fromEntries(request.nextUrl.searchParams);
    const parsed = querySchema.safeParse(params);
    if (!parsed.success) {
      return apiError('VALIDATION_ERROR', 'Invalid query parameters', 400, parsed.error.flatten());
    }

    const { page, limit, isRead, type, severity } = parsed.data;
    const { skip, take, page: safePage, limit: safeLimit } = paginate(page, limit);

    const { items, total } = await listNotifications({
      userId: user.id,
      isRead,
      type: type as Parameters<typeof listNotifications>[0]['type'],
      severity: severity as Parameters<typeof listNotifications>[0]['severity'],
      skip,
      take,
    });

    return apiSuccess(items, { total, page: safePage, limit: safeLimit });
  } catch (error) {
    console.error('[API] GET /notifications error:', error);
    return apiError('INTERNAL_ERROR', 'Failed to fetch notifications', 500);
  }
}
