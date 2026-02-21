import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/utils';
import { getCurrentUser } from '@/lib/auth';
import { z } from 'zod';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return apiError('UNAUTHORIZED', 'Unauthorized', 401);

    const { id } = await params;

    const session = await prisma.aIChatSession.findFirst({
      where: { id, userId: user.id },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            role: true,
            content: true,
            toolCalls: true,
            tokenCount: true,
            model: true,
            latencyMs: true,
            createdAt: true,
          },
        },
      },
    });

    if (!session) {
      return apiError('NOT_FOUND', 'Chat session not found', 404);
    }

    return apiSuccess(session);
  } catch {
    return apiError('INTERNAL_ERROR', 'Failed to fetch chat session', 500);
  }
}

const updateSchema = z.object({
  title: z.string().optional(),
  isArchived: z.boolean().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return apiError('UNAUTHORIZED', 'Unauthorized', 401);

    const { id } = await params;
    const body = await request.json();
    const data = updateSchema.parse(body);

    const existing = await prisma.aIChatSession.findFirst({
      where: { id, userId: user.id },
    });

    if (!existing) {
      return apiError('NOT_FOUND', 'Chat session not found', 404);
    }

    const session = await prisma.aIChatSession.update({
      where: { id },
      data,
    });

    return apiSuccess(session);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return apiError('VALIDATION_ERROR', 'Invalid request body', 400, err.issues);
    }
    return apiError('INTERNAL_ERROR', 'Failed to update chat session', 500);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return apiError('UNAUTHORIZED', 'Unauthorized', 401);

    const { id } = await params;

    const existing = await prisma.aIChatSession.findFirst({
      where: { id, userId: user.id },
    });

    if (!existing) {
      return apiError('NOT_FOUND', 'Chat session not found', 404);
    }

    await prisma.aIChatSession.delete({ where: { id } });

    return apiSuccess({ deleted: true });
  } catch {
    return apiError('INTERNAL_ERROR', 'Failed to delete chat session', 500);
  }
}
