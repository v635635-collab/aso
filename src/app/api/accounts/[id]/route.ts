import { NextRequest } from 'next/server';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/utils';

const accountUpdateSchema = z.object({
  email: z.string().email().optional(),
  teamName: z.string().optional().nullable(),
  teamId: z.string().optional().nullable(),
  status: z.enum(['ACTIVE', 'SUSPENDED', 'EXPIRED', 'BANNED']).optional(),
  maxApps: z.number().int().min(1).optional(),
  expiresAt: z.string().datetime().optional().nullable(),
  credentials: z.record(z.string(), z.unknown()).optional().nullable(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional().nullable(),
});

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const account = await prisma.appleAccount.findUnique({
      where: { id },
      include: {
        apps: {
          orderBy: { name: 'asc' },
          select: {
            id: true, name: true, bundleId: true, status: true,
            iconUrl: true, organicDownloads: true, categoryRank: true,
          },
        },
        _count: { select: { apps: true } },
      },
    });

    if (!account) {
      return apiError('NOT_FOUND', 'Account not found', 404);
    }
    return apiSuccess(account);
  } catch {
    return apiError('INTERNAL_ERROR', 'Failed to fetch account', 500);
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const data = accountUpdateSchema.parse(body);

    const { credentials, ...rest } = data;
    const credentialsValue = credentials === null
      ? Prisma.JsonNull
      : credentials !== undefined
        ? (credentials as Prisma.InputJsonValue)
        : undefined;
    const account = await prisma.appleAccount.update({
      where: { id },
      data: {
        ...rest,
        expiresAt: data.expiresAt === null ? null : data.expiresAt ? new Date(data.expiresAt) : undefined,
        ...(credentialsValue !== undefined && { credentials: credentialsValue }),
      },
    });

    return apiSuccess(account);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return apiError('VALIDATION_ERROR', 'Invalid account data', 400, err.issues);
    }
    const prismaErr = err as { code?: string };
    if (prismaErr.code === 'P2025') {
      return apiError('NOT_FOUND', 'Account not found', 404);
    }
    if (prismaErr.code === 'P2002') {
      return apiError('CONFLICT', 'Email already in use', 409);
    }
    return apiError('INTERNAL_ERROR', 'Failed to update account', 500);
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    await prisma.appleAccount.delete({ where: { id } });
    return apiSuccess({ deleted: true });
  } catch (err) {
    const prismaErr = err as { code?: string };
    if (prismaErr.code === 'P2025') {
      return apiError('NOT_FOUND', 'Account not found', 404);
    }
    return apiError('INTERNAL_ERROR', 'Failed to delete account', 500);
  }
}
