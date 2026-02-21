import { NextRequest } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/utils';
import { sendRequest } from '@/lib/asomobile/client';
import { ASOMOBILE_ENDPOINTS } from '@/lib/asomobile/endpoints';
import { QueuePriority } from '@/lib/asomobile/types';
import type { ASOMobileEndpointName, ASOMobileParams } from '@/lib/asomobile/types';

const ENDPOINT_NAMES = [
  'keyword-check',
  'keyword-suggest',
  'keyword-rank',
  'app-profile',
  'app-keywords',
  'worldwide-check',
] as const;

const requestSchema = z.object({
  endpoint: z.enum(ENDPOINT_NAMES),
  params: z.record(z.string(), z.unknown()),
  priority: z.enum(['HIGH', 'NORMAL', 'LOW']).optional(),
  relatedEntityType: z.string().optional(),
  relatedEntityId: z.string().optional(),
});

const PRIORITY_MAP: Record<string, QueuePriority> = {
  HIGH: QueuePriority.HIGH,
  NORMAL: QueuePriority.NORMAL,
  LOW: QueuePriority.LOW,
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return apiError('VALIDATION_ERROR', 'Invalid request parameters', 400, parsed.error.issues);
    }

    const { endpoint, params, priority, relatedEntityType, relatedEntityId } = parsed.data;
    const endpointConfig = ASOMOBILE_ENDPOINTS[endpoint];

    const ticketResponse = await sendRequest(
      endpoint as ASOMobileEndpointName,
      params as unknown as ASOMobileParams,
      priority ? PRIORITY_MAP[priority] : undefined,
    );

    const task = await prisma.aSOMobileTask.create({
      data: {
        ticketId: ticketResponse.ticket_id,
        endpoint,
        method: endpointConfig.method,
        params: params as object,
        status: 'PENDING',
        relatedEntityType,
        relatedEntityId,
      },
    });

    return apiSuccess(task);
  } catch (error) {
    if (error instanceof Error) {
      return apiError('ASOMOBILE_ERROR', error.message, 500);
    }
    return apiError('INTERNAL_ERROR', 'Something went wrong', 500);
  }
}
