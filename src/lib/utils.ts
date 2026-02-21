import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function apiSuccess<T>(data: T, meta?: { total: number; page: number; limit: number }) {
  return NextResponse.json({
    success: true,
    data,
    meta,
    requestId: randomUUID(),
    timestamp: new Date().toISOString(),
  });
}

export function apiError(
  code: string,
  message: string,
  statusCode: number = 500,
  details?: unknown
) {
  return NextResponse.json(
    {
      success: false,
      error: { code, message, details },
      requestId: randomUUID(),
      timestamp: new Date().toISOString(),
    },
    { status: statusCode }
  );
}

export function paginate(page: number = 1, limit: number = 20) {
  const safePage = Math.max(1, page);
  const safeLimit = Math.min(100, Math.max(1, limit));
  return {
    skip: (safePage - 1) * safeLimit,
    take: safeLimit,
    page: safePage,
    limit: safeLimit,
  };
}
