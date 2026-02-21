import { AppError } from '@/lib/errors';
import { asomobileQueue } from './queue';
import { ASOMOBILE_ENDPOINTS } from './endpoints';
import { QueuePriority } from './types';
import type {
  ASOMobileEndpointName,
  ASOMobileParams,
  ASOMobileTicketResponse,
  ASOMobileAPIResponse,
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

async function callAPIGet<T>(path: string, params: Record<string, unknown>): Promise<T> {
  const url = new URL(`${getApiUrl()}${path}`);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        url.searchParams.set(key, value.join(','));
      } else {
        url.searchParams.set(key, String(value));
      }
    }
  }

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: { Authorization: getApiToken() },
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

async function callAPIPost<T>(path: string, body: Record<string, unknown>): Promise<T> {
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
): Promise<{ ticket_id: string }> {
  const config = ASOMOBILE_ENDPOINTS[endpoint];
  if (!config) {
    throw new AppError(`Unknown endpoint: ${endpoint}`, 'INVALID_ENDPOINT', 400);
  }

  return asomobileQueue.enqueue(async () => {
    let response: ASOMobileAPIResponse<ASOMobileTicketResponse>;

    if (config.method === 'GET') {
      response = await callAPIGet<ASOMobileAPIResponse<ASOMobileTicketResponse>>(
        config.path,
        params as unknown as Record<string, unknown>,
      );
    } else {
      response = await callAPIPost<ASOMobileAPIResponse<ASOMobileTicketResponse>>(
        config.path,
        params as unknown as Record<string, unknown>,
      );
    }

    if (!response.data?.ticket_id) {
      throw new AppError(
        `ASOMobile API returned no ticket_id: ${JSON.stringify(response)}`,
        'ASOMOBILE_API_ERROR',
        500,
      );
    }

    return { ticket_id: String(response.data.ticket_id) };
  }, priority);
}

/**
 * Poll ASOMobile for the result of a previously submitted ticket.
 */
export async function getResult<T = unknown>(
  endpoint: ASOMobileEndpointName,
  ticketId: string,
  priority: QueuePriority = QueuePriority.LOW,
): Promise<{ status: 'done' | 'pending' | 'error'; data?: T; error?: string }> {
  const config = ASOMOBILE_ENDPOINTS[endpoint];
  if (!config) {
    throw new AppError(`Unknown endpoint: ${endpoint}`, 'INVALID_ENDPOINT', 400);
  }

  return asomobileQueue.enqueue(async () => {
    const response = await callAPIGet<ASOMobileAPIResponse<T>>(config.resultPath, {
      ticket_id: ticketId,
    });

    if (response.code === 200 && response.data !== undefined) {
      return { status: 'done' as const, data: response.data };
    }

    if (response.code >= 400) {
      return { status: 'error' as const, error: response.message || 'API error' };
    }

    return { status: 'pending' as const };
  }, priority);
}
