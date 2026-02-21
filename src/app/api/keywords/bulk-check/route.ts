import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/utils';
import { getCurrentUser } from '@/lib/auth';
import { sendRequest } from '@/lib/asomobile/client';
import { z } from 'zod';

const bulkCheckSchema = z.object({
  keywords: z.array(z.string().min(1)).min(1).max(50),
  country: z.string().default('RU'),
  lang: z.string().default('ru'),
});

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return apiError('UNAUTHORIZED', 'Unauthorized', 401);

    const body = await request.json();
    const { keywords, country, lang } = bulkCheckSchema.parse(body);

    const job = await prisma.asyncJob.create({
      data: {
        type: 'BULK_KEYWORD_CHECK',
        triggeredBy: user.id,
        input: { keywords, country, lang },
        status: 'RUNNING',
        startedAt: new Date(),
        progress: 0,
      },
    });

    const tasks = [];
    for (const query of keywords) {
      try {
        const ticket = await sendRequest('keyword-check', { query, country, lang });
        const task = await prisma.aSOMobileTask.create({
          data: {
            ticketId: ticket.ticket_id,
            endpoint: 'keyword-check',
            method: 'POST',
            params: { query, country, lang },
            status: 'POLLING',
            relatedEntityType: 'async_job',
            relatedEntityId: job.id,
          },
        });
        tasks.push({ keyword: query, taskId: task.id, ticketId: ticket.ticket_id });
      } catch {
        tasks.push({ keyword: query, taskId: null, error: 'Failed to submit' });
      }
    }

    return apiSuccess({
      jobId: job.id,
      total: keywords.length,
      submitted: tasks.filter((t) => t.taskId).length,
      tasks,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return apiError('VALIDATION_ERROR', 'Invalid request body', 400, err.issues);
    }
    return apiError('INTERNAL_ERROR', 'Failed to bulk check keywords', 500);
  }
}
