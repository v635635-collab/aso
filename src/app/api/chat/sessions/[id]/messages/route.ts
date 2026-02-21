import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/utils';
import { getCurrentUser } from '@/lib/auth';
import { chatCompletion, type ChatMessage } from '@/lib/ai/openrouter';
import { buildAIContext } from '@/lib/ai/context-builder';
import { executeToolCall } from '@/lib/ai/tool-executor';
import { AI_TOOLS } from '@/lib/ai/tools';
import { formatToolForOpenRouter } from '@/lib/ai/tools/types';
import { encodeSSE, encodeSSEDone, iterateSSEStream, type ParsedStreamEvent } from '@/lib/ai/streaming';
import { z } from 'zod';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return apiError('UNAUTHORIZED', 'Unauthorized', 401);

    const { id } = await params;

    const session = await prisma.aIChatSession.findFirst({
      where: { id, userId: user.id },
    });

    if (!session) return apiError('NOT_FOUND', 'Chat session not found', 404);

    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const limit = Math.min(Number(searchParams.limit) || 50, 100);
    const cursor = searchParams.cursor;

    const messages = await prisma.aIChatMessage.findMany({
      where: { sessionId: id },
      take: limit,
      orderBy: { createdAt: 'asc' },
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    return apiSuccess(messages);
  } catch {
    return apiError('INTERNAL_ERROR', 'Failed to fetch messages', 500);
  }
}

const sendMessageSchema = z.object({
  content: z.string().min(1).max(10000),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return apiError('UNAUTHORIZED', 'Unauthorized', 401);

    const { id } = await params;
    const body = await request.json();
    const { content } = sendMessageSchema.parse(body);

    const session = await prisma.aIChatSession.findFirst({
      where: { id, userId: user.id },
    });

    if (!session) return apiError('NOT_FOUND', 'Chat session not found', 404);

    await prisma.aIChatMessage.create({
      data: { sessionId: id, role: 'USER', content },
    });

    const previousMessages = await prisma.aIChatMessage.findMany({
      where: { sessionId: id },
      orderBy: { createdAt: 'asc' },
      take: 50,
    });

    const sessionContext = session.context as Record<string, string> | null;
    const aiContext = await buildAIContext({
      appId: sessionContext?.appId,
      nicheId: sessionContext?.nicheId,
    });

    const messages: ChatMessage[] = [];

    if (session.systemPrompt) {
      messages.push({
        role: 'system',
        content: session.systemPrompt + '\n\n---\n\n' + aiContext,
      });
    }

    for (const msg of previousMessages) {
      if (msg.role === 'SYSTEM') continue;
      messages.push({
        role: msg.role.toLowerCase() as ChatMessage['role'],
        content: msg.content,
        ...(msg.toolCalls ? { tool_calls: msg.toolCalls as unknown[] } : {}),
        ...(msg.role === 'TOOL' && msg.metadata ? {
          tool_call_id: (msg.metadata as Record<string, string>).tool_call_id,
        } : {}),
      });
    }

    const tools = AI_TOOLS.map(formatToolForOpenRouter);
    const startTime = Date.now();

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();

        try {
          let fullContent = '';
          let totalTokens = 0;
          let continueLoop = true;
          let currentMessages = [...messages];

          while (continueLoop) {
            continueLoop = false;

            const response = await chatCompletion(currentMessages, {
              model: session.model,
              stream: true,
              tools: tools.length > 0 ? tools : undefined,
              temperature: 0.7,
            }) as ReadableStream<Uint8Array>;

            const pendingToolCalls = new Map<number, {
              id: string;
              name: string;
              arguments: string;
            }>();
            let finishReason: string | null = null;
            let chunkContent = '';

            for await (const event of iterateSSEStream(response)) {
              if (event.content) {
                fullContent += event.content;
                chunkContent += event.content;
                controller.enqueue(encoder.encode(
                  encodeSSE({ type: 'content', content: event.content })
                ));
              }

              if (event.toolCalls) {
                for (const tc of event.toolCalls) {
                  const existing = pendingToolCalls.get(tc.index);
                  if (existing) {
                    if (tc.arguments) existing.arguments += tc.arguments;
                  } else {
                    pendingToolCalls.set(tc.index, {
                      id: tc.id || `call_${tc.index}`,
                      name: tc.name || '',
                      arguments: tc.arguments || '',
                    });
                  }
                }
              }

              if (event.finishReason) finishReason = event.finishReason;
              if (event.usage) totalTokens = event.usage.totalTokens;
            }

            if (finishReason === 'tool_calls' && pendingToolCalls.size > 0) {
              const toolCallsArray = Array.from(pendingToolCalls.values());

              const assistantToolCalls = toolCallsArray.map(tc => ({
                id: tc.id,
                type: 'function' as const,
                function: { name: tc.name, arguments: tc.arguments },
              }));

              currentMessages.push({
                role: 'assistant',
                content: chunkContent || '',
                tool_calls: assistantToolCalls,
              });

              for (const tc of toolCallsArray) {
                controller.enqueue(encoder.encode(
                  encodeSSE({
                    type: 'tool_call_start',
                    toolCall: { id: tc.id, name: tc.name, arguments: tc.arguments },
                  })
                ));

                let toolResult: unknown;
                try {
                  const args = JSON.parse(tc.arguments);
                  toolResult = await executeToolCall(tc.name, args);
                } catch (err) {
                  toolResult = { error: err instanceof Error ? err.message : 'Tool execution failed' };
                }

                controller.enqueue(encoder.encode(
                  encodeSSE({
                    type: 'tool_call_result',
                    toolResult: { id: tc.id, name: tc.name, result: toolResult },
                  })
                ));

                currentMessages.push({
                  role: 'tool',
                  content: JSON.stringify(toolResult),
                  tool_call_id: tc.id,
                });

                await prisma.aIChatMessage.create({
                  data: {
                    sessionId: id,
                    role: 'TOOL',
                    content: JSON.stringify(toolResult),
                    metadata: { tool_call_id: tc.id, tool_name: tc.name },
                  },
                });
              }

              continueLoop = true;
              chunkContent = '';
            }
          }

          const latencyMs = Date.now() - startTime;

          const toolCallsSerialized = fullContent ? undefined : null;

          await prisma.aIChatMessage.create({
            data: {
              sessionId: id,
              role: 'ASSISTANT',
              content: fullContent,
              tokenCount: totalTokens,
              model: session.model,
              latencyMs,
            },
          });

          await prisma.aIChatSession.update({
            where: { id },
            data: {
              messageCount: { increment: 2 },
              totalTokens: { increment: totalTokens },
              lastMessageAt: new Date(),
              ...(session.messageCount === 0 && fullContent
                ? { title: fullContent.slice(0, 60).replace(/\n/g, ' ') }
                : {}),
            },
          });

          controller.enqueue(encoder.encode(
            encodeSSE({
              type: 'done',
              usage: { promptTokens: 0, completionTokens: 0, totalTokens },
            })
          ));
          controller.enqueue(encoder.encode(encodeSSEDone()));
        } catch (err) {
          controller.enqueue(encoder.encode(
            encodeSSE({
              type: 'error',
              error: err instanceof Error ? err.message : 'Stream failed',
            })
          ));
          controller.enqueue(encoder.encode(encodeSSEDone()));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return apiError('VALIDATION_ERROR', 'Invalid message', 400, err.issues);
    }
    return apiError('INTERNAL_ERROR', 'Failed to send message', 500);
  }
}
