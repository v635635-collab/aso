import { apiSuccess, apiError } from '@/lib/utils';
import prisma from '@/lib/prisma';

interface HealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: {
    database: CheckResult;
    asomobile: CheckResult;
    openrouter: CheckResult;
  };
  timestamp: string;
  uptime: number;
}

interface CheckResult {
  status: 'ok' | 'error';
  latencyMs: number;
  message?: string;
}

const startTime = Date.now();

async function checkDatabase(): Promise<CheckResult> {
  const start = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { status: 'ok', latencyMs: Date.now() - start };
  } catch (error) {
    return { status: 'error', latencyMs: Date.now() - start, message: (error as Error).message };
  }
}

async function checkAsomobile(): Promise<CheckResult> {
  const start = Date.now();
  const apiKey = process.env.ASOMOBILE_TOKEN;
  if (!apiKey) {
    return { status: 'error', latencyMs: 0, message: 'ASOMOBILE_TOKEN not configured' };
  }

  try {
    const res = await fetch('https://api.asomobile.net/account', {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(10_000),
    });
    return {
      status: res.ok ? 'ok' : 'error',
      latencyMs: Date.now() - start,
      message: res.ok ? undefined : `HTTP ${res.status}`,
    };
  } catch (error) {
    return { status: 'error', latencyMs: Date.now() - start, message: (error as Error).message };
  }
}

async function checkOpenRouter(): Promise<CheckResult> {
  const start = Date.now();
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return { status: 'error', latencyMs: 0, message: 'OPENROUTER_API_KEY not configured' };
  }

  try {
    const res = await fetch('https://openrouter.ai/api/v1/models', {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(10_000),
    });
    return {
      status: res.ok ? 'ok' : 'error',
      latencyMs: Date.now() - start,
      message: res.ok ? undefined : `HTTP ${res.status}`,
    };
  } catch (error) {
    return { status: 'error', latencyMs: Date.now() - start, message: (error as Error).message };
  }
}

export async function GET() {
  try {
    const [database, asomobile, openrouter] = await Promise.all([
      checkDatabase(),
      checkAsomobile(),
      checkOpenRouter(),
    ]);

    const checks = { database, asomobile, openrouter };
    const allOk = Object.values(checks).every((c) => c.status === 'ok');
    const anyError = Object.values(checks).some((c) => c.status === 'error');

    const health: HealthCheck = {
      status: allOk ? 'healthy' : anyError ? 'degraded' : 'healthy',
      checks,
      timestamp: new Date().toISOString(),
      uptime: Date.now() - startTime,
    };

    return apiSuccess(health);
  } catch (error) {
    console.error('[API] GET /health error:', error);
    return apiError('INTERNAL_ERROR', 'Health check failed', 500);
  }
}
