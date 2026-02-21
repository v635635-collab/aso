import { NextRequest } from 'next/server';
import { z } from 'zod';
import { apiSuccess, apiError } from '@/lib/utils';
import { getCurrentUser } from '@/lib/auth';
import { getTaxonomy, createTag } from '@/lib/tagging/taxonomy';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return apiError('UNAUTHORIZED', 'Not authenticated', 401);

    const tags = await getTaxonomy();
    return apiSuccess(tags);
  } catch (error) {
    console.error('[API] GET /tags/taxonomy error:', error);
    return apiError('INTERNAL_ERROR', 'Failed to fetch taxonomy', 500);
  }
}

const createTagSchema = z.object({
  tag: z.string().min(1).max(100),
  category: z.string().min(1).max(50),
  displayName: z.string().min(1).max(100),
  parentTag: z.string().optional(),
  synonyms: z.array(z.string()).optional(),
  autoApplyRules: z.record(z.string(), z.unknown()).optional(),
  color: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return apiError('UNAUTHORIZED', 'Not authenticated', 401);

    const body = await request.json();
    const parsed = createTagSchema.safeParse(body);
    if (!parsed.success) {
      return apiError('VALIDATION_ERROR', 'Invalid tag data', 400, parsed.error.flatten());
    }

    const tag = await createTag(parsed.data);
    return apiSuccess(tag);
  } catch (error) {
    if ((error as { code?: string }).code === 'P2002') {
      return apiError('CONFLICT', 'Tag already exists', 409);
    }
    console.error('[API] POST /tags/taxonomy error:', error);
    return apiError('INTERNAL_ERROR', 'Failed to create tag', 500);
  }
}
