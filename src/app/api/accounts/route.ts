import { NextRequest } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { apiSuccess, apiError, paginate } from '@/lib/utils';
import { paginationSchema, searchSchema } from '@/lib/validators';

const accountCreateSchema = z.object({
  email: z.string().email(),
  teamName: z.string().optional(),
  teamId: z.string().optional(),
  status: z.enum(['ACTIVE', 'SUSPENDED', 'EXPIRED', 'BANNED']).default('ACTIVE'),
  maxApps: z.number().int().min(1).default(30),
  expiresAt: z.string().datetime().optional(),
  credentials: z.record(z.string(), z.unknown()).optional(),
  tags: z.array(z.string()).default([]),
  notes: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const url = request.nextUrl.searchParams;
    const { page, limit } = paginationSchema.parse({
      page: url.get('page') ?? undefined,
      limit: url.get('limit') ?? undefined,
    });
    const { search } = searchSchema.parse({ search: url.get('search') ?? undefined });
    const status = url.get('status');

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { teamName: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (status) where.status = status;

    const { skip, take } = paginate(page, limit);
    const [accounts, total] = await Promise.all([
      prisma.appleAccount.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { apps: true } } },
      }),
      prisma.appleAccount.count({ where }),
    ]);

    return apiSuccess(accounts, { total, page, limit });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return apiError('VALIDATION_ERROR', 'Invalid query parameters', 400, err.issues);
    }
    return apiError('INTERNAL_ERROR', 'Failed to fetch accounts', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = accountCreateSchema.parse(body);

    const { credentials, ...rest } = data;
    const account = await prisma.appleAccount.create({
      data: {
        ...rest,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
        ...(credentials !== undefined && { credentials: credentials as Record<string, string> }),
      },
    });

    return apiSuccess(account);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return apiError('VALIDATION_ERROR', 'Invalid account data', 400, err.issues);
    }
    const prismaErr = err as { code?: string };
    if (prismaErr.code === 'P2002') {
      return apiError('CONFLICT', 'Account with this email already exists', 409);
    }
    return apiError('INTERNAL_ERROR', 'Failed to create account', 500);
  }
}
