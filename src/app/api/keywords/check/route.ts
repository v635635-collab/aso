import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/utils';
import { getCurrentUser } from '@/lib/auth';
import { sendRequest } from '@/lib/asomobile/client';
import type { KeywordCheckParams } from '@/lib/asomobile/types';
import { z } from 'zod';

const checkSchema = z.object({
  keyword: z.string().min(1),
  country: z.string().default('RU'),
});

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return apiError('UNAUTHORIZED', 'Unauthorized', 401);

    const body = await request.json();
    const { keyword, country } = checkSchema.parse(body);

    const params = { keyword, country, platform: 'IOS' as const, ios_device: 'IPHONE' as const };
    const ticket = await sendRequest('keyword-check', params);

    const task = await prisma.aSOMobileTask.create({
      data: {
        ticketId: ticket.ticket_id,
        endpoint: 'keyword-check',
        method: 'POST',
        params,
        status: 'POLLING',
        relatedEntityType: 'keyword',
      },
    });

    return apiSuccess({
      taskId: task.id,
      ticketId: ticket.ticket_id,
      status: 'POLLING',
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return apiError('VALIDATION_ERROR', 'Invalid request body', 400, err.issues);
    }
    return apiError('INTERNAL_ERROR', 'Failed to check keyword', 500);
  }
}
