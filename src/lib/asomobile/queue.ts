import { ASOMOBILE_RPM } from '@/config/constants';
import { AppError, RateLimitError } from '@/lib/errors';
import { QueuePriority, CircuitState } from './types';
import type { QueueStats } from './types';

const FAILURE_THRESHOLD = 5;
const RESET_TIMEOUT_MS = 60_000;

interface QueueItem {
  fn: () => Promise<unknown>;
  priority: QueuePriority;
  resolve: (value: unknown) => void;
  reject: (reason: unknown) => void;
  enqueuedAt: number;
}

export class ASOMobileQueue {
  private queue: QueueItem[] = [];
  private processing = false;

  private tokens: number;
  private maxTokens: number;
  private lastRefillTime: number;
  private refillIntervalMs: number;

  private circuitState = CircuitState.CLOSED;
  private consecutiveFailures = 0;
  private lastFailureTime = 0;

  constructor(rpm: number = ASOMOBILE_RPM) {
    this.maxTokens = rpm;
    this.tokens = rpm;
    this.lastRefillTime = Date.now();
    this.refillIntervalMs = 60_000 / rpm;
  }

  async enqueue<T>(
    fn: () => Promise<T>,
    priority: QueuePriority = QueuePriority.NORMAL,
  ): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.queue.push({
        fn: fn as () => Promise<unknown>,
        priority,
        resolve: resolve as (value: unknown) => void,
        reject,
        enqueuedAt: Date.now(),
      });
      this.queue.sort((a, b) => a.priority - b.priority);
      this.processQueue();
    });
  }

  getStats(): QueueStats {
    this.refillTokens();
    return {
      queued: this.queue.length,
      circuitState: this.circuitState,
      tokensRemaining: Math.floor(this.tokens),
    };
  }

  // -----------------------------------------------------------------------
  // Internal processing loop
  // -----------------------------------------------------------------------

  private async processQueue(): Promise<void> {
    if (this.processing) return;
    this.processing = true;

    while (this.queue.length > 0) {
      const item = this.queue.shift()!;

      try {
        this.assertCircuitClosed();
        await this.acquireToken();

        const result = await item.fn();
        this.recordSuccess();
        item.resolve(result);
      } catch (error) {
        if (this.isServerError(error)) {
          this.recordFailure();
        }
        item.reject(error);
      }
    }

    this.processing = false;

    if (this.queue.length > 0) {
      this.processQueue();
    }
  }

  // -----------------------------------------------------------------------
  // Circuit breaker
  // -----------------------------------------------------------------------

  private assertCircuitClosed(): void {
    if (this.circuitState === CircuitState.CLOSED) return;

    if (this.circuitState === CircuitState.OPEN) {
      if (Date.now() - this.lastFailureTime >= RESET_TIMEOUT_MS) {
        this.circuitState = CircuitState.HALF_OPEN;
        return;
      }
      throw new RateLimitError(
        'Circuit breaker is open — ASOMobile API temporarily unavailable',
      );
    }
    // HALF_OPEN: allow one request through to probe
  }

  private recordSuccess(): void {
    this.consecutiveFailures = 0;
    if (this.circuitState === CircuitState.HALF_OPEN) {
      this.circuitState = CircuitState.CLOSED;
    }
  }

  private recordFailure(): void {
    this.consecutiveFailures++;
    this.lastFailureTime = Date.now();
    if (this.consecutiveFailures >= FAILURE_THRESHOLD) {
      this.circuitState = CircuitState.OPEN;
    }
  }

  private isServerError(error: unknown): boolean {
    return error instanceof AppError && error.statusCode >= 500;
  }

  // -----------------------------------------------------------------------
  // Token bucket
  // -----------------------------------------------------------------------

  private refillTokens(): void {
    const now = Date.now();
    const elapsed = now - this.lastRefillTime;
    const tokensToAdd = Math.floor(elapsed / this.refillIntervalMs);
    if (tokensToAdd > 0) {
      this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd);
      this.lastRefillTime += tokensToAdd * this.refillIntervalMs;
    }
  }

  private async acquireToken(): Promise<void> {
    this.refillTokens();
    while (this.tokens < 1) {
      await this.sleep(this.refillIntervalMs);
      this.refillTokens();
    }
    this.tokens--;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((r) => setTimeout(r, ms));
  }
}

export const asomobileQueue = new ASOMobileQueue();
