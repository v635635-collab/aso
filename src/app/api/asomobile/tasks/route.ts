import { NextRequest } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { apiSuccess, apiError, paginate } from '@/lib/utils';

const tasksQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  status: z
    .enum(['PENDING', 'POLLING', 'COMPLETED', 'FAILED', 'TIMEOUT'])
    .optional(),
  endpoint: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const parsed = tasksQuerySchema.safeParse(searchParams);

    if (!parsed.success) {
      return apiError('VALIDATION_ERROR', 'Invalid query parameters', 400, parsed.error.issues);
    }

    const { page, limit, status, endpoint } = parsed.data;
    const { skip, take, page: safePage, limit: safeLimit } = paginate(page, limit);

    const where = {
      ...(status ? { status } : {}),
      ...(endpoint ? { endpoint } : {}),
    };

    const [tasks, total] = await Promise.all([
      prisma.aSOMobileTask.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take }),
      prisma.aSOMobileTask.count({ where }),
    ]);

    return apiSuccess(tasks, { total, page: safePage, limit: safeLimit });
  } catch {
    return apiError('INTERNAL_ERROR', 'Something went wrong', 500);
  }
}
