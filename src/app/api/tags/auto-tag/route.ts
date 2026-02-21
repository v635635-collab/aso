import { NextRequest } from 'next/server';
import { z } from 'zod';
import { apiSuccess, apiError } from '@/lib/utils';
import { getCurrentUser } from '@/lib/auth';
import { autoTagEntity } from '@/lib/tagging/auto-tagger';

const autoTagSchema = z.object({
  entities: z.array(
    z.object({
      entityType: z.enum(['App', 'Keyword', 'Niche']),
      entityId: z.string().min(1),
    })
  ).min(1).max(100),
});

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return apiError('UNAUTHORIZED', 'Not authenticated', 401);

    const body = await request.json();
    const parsed = autoTagSchema.safeParse(body);
    if (!parsed.success) {
      return apiError('VALIDATION_ERROR', 'Invalid request body', 400, parsed.error.flatten());
    }

    const results = await Promise.all(
      parsed.data.entities.map(async ({ entityType, entityId }) => {
        try {
          const appliedTags = await autoTagEntity(entityType, entityId);
          return { entityType, entityId, appliedTags, success: true };
        } catch (error) {
          return { entityType, entityId, appliedTags: [], success: false, error: (error as Error).message };
        }
      })
    );

    return apiSuccess(results);
  } catch (error) {
    console.error('[API] POST /tags/auto-tag error:', error);
    return apiError('INTERNAL_ERROR', 'Failed to auto-tag entities', 500);
  }
}
