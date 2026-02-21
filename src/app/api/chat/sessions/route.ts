import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/utils';
import { getCurrentUser } from '@/lib/auth';
import { buildSystemPrompt } from '@/lib/ai/system-prompt';
import { z } from 'zod';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return apiError('UNAUTHORIZED', 'Unauthorized', 401);

    const params = Object.fromEntries(request.nextUrl.searchParams);
    const includeArchived = params.archived === 'true';

    const sessions = await prisma.aIChatSession.findMany({
      where: {
        userId: user.id,
        ...(includeArchived ? {} : { isArchived: false }),
      },
      orderBy: { lastMessageAt: { sort: 'desc', nulls: 'last' } },
      select: {
        id: true,
        title: true,
        model: true,
        messageCount: true,
        totalTokens: true,
        lastMessageAt: true,
        createdAt: true,
        isArchived: true,
        context: true,
      },
    });

    return apiSuccess(sessions);
  } catch {
    return apiError('INTERNAL_ERROR', 'Failed to fetch chat sessions', 500);
  }
}

const createSessionSchema = z.object({
  title: z.string().optional(),
  appId: z.string().optional(),
  nicheId: z.string().optional(),
  model: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return apiError('UNAUTHORIZED', 'Unauthorized', 401);

    const body = await request.json();
    const data = createSessionSchema.parse(body);

    const context: Record<string, string> = {};
    if (data.appId) context.appId = data.appId;
    if (data.nicheId) context.nicheId = data.nicheId;

    const systemPrompt = buildSystemPrompt(context);

    const session = await prisma.aIChatSession.create({
      data: {
        userId: user.id,
        title: data.title || 'New Chat',
        context,
        systemPrompt,
        model: data.model || 'openai/gpt-4o',
      },
    });

    return apiSuccess(session);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return apiError('VALIDATION_ERROR', 'Invalid request body', 400, err.issues);
    }
    return apiError('INTERNAL_ERROR', 'Failed to create chat session', 500);
  }
}
