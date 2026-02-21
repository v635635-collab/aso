import { AppError } from '@/lib/errors';
import { asomobileQueue } from './queue';
import { ASOMOBILE_ENDPOINTS } from './endpoints';
import { QueuePriority } from './types';
import type {
  ASOMobileEndpointName,
  ASOMobileParams,
  ASOMobileTicketResponse,
  ASOMobileResultResponse,
} from './types';

function getApiUrl(): string {
  const url = process.env.ASOMOBILE_API_URL;
  if (!url) throw new AppError('ASOMOBILE_API_URL is not configured', 'CONFIG_ERROR', 500);
  return url;
}

function getApiToken(): string {
  const token = process.env.ASOMOBILE_TOKEN;
  if (!token) throw new AppError('ASOMOBILE_TOKEN is not configured', 'CONFIG_ERROR', 500);
  return token;
}

async function callAPI<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const response = await fetch(`${getApiUrl()}${path}`, {
    method: 'POST',
    headers: {
      Authorization: getApiToken(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => 'Unknown error');
    throw new AppError(
      `ASOMobile API error: ${response.status} — ${text}`,
      'ASOMOBILE_API_ERROR',
      response.status,
    );
  }

  return response.json() as Promise<T>;
}

/**
 * Send an async request to ASOMobile. Returns a ticket_id that can be polled
 * via {@link getResult} or automatically by the asomobile-poller cron job.
 */
export async function sendRequest(
  endpoint: ASOMobileEndpointName,
  params: ASOMobileParams,
  priority: QueuePriority = QueuePriority.NORMAL,
): Promise<ASOMobileTicketResponse> {
  const config = ASOMOBILE_ENDPOINTS[endpoint];
  if (!config) {
    throw new AppError(`Unknown endpoint: ${endpoint}`, 'INVALID_ENDPOINT', 400);
  }

  return asomobileQueue.enqueue(
    () => callAPI<ASOMobileTicketResponse>(config.path, params as unknown as Record<string, unknown>),
    priority,
  );
}

/**
 * Poll ASOMobile for the result of a previously submitted ticket.
 */
export async function getResult<T = unknown>(
  endpoint: ASOMobileEndpointName,
  ticketId: string,
  priority: QueuePriority = QueuePriority.LOW,
): Promise<ASOMobileResultResponse<T>> {
  const config = ASOMOBILE_ENDPOINTS[endpoint];
  if (!config) {
    throw new AppError(`Unknown endpoint: ${endpoint}`, 'INVALID_ENDPOINT', 400);
  }

  return asomobileQueue.enqueue(
    () => callAPI<ASOMobileResultResponse<T>>(config.resultPath, { ticket_id: ticketId }),
    priority,
  );
}
