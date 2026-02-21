import { getCurrentUser } from '@/lib/auth';
import { apiSuccess, apiError } from '@/lib/utils';

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return apiError('UNAUTHORIZED', 'Not authenticated', 401);
    }

    return apiSuccess({ user });
  } catch {
    return apiError('INTERNAL_ERROR', 'Something went wrong', 500);
  }
}
