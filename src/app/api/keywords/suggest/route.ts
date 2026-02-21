import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/utils';
import { getCurrentUser } from '@/lib/auth';
import { sendRequest } from '@/lib/asomobile/client';
import { z } from 'zod';

const suggestSchema = z.object({
  query: z.string().min(1),
  country: z.string().default('RU'),
  lang: z.string().default('ru'),
});

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return apiError('UNAUTHORIZED', 'Unauthorized', 401);

    const body = await request.json();
    const { query, country, lang } = suggestSchema.parse(body);

    const ticket = await sendRequest('keyword-suggest', { query, country, lang });

    const task = await prisma.aSOMobileTask.create({
      data: {
        ticketId: ticket.ticket_id,
        endpoint: 'keyword-suggest',
        method: 'POST',
        params: { query, country, lang },
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
    return apiError('INTERNAL_ERROR', 'Failed to get suggestions', 500);
  }
}
