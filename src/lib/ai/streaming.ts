export interface SSEChunk {
  type: 'content' | 'tool_call_start' | 'tool_call_result' | 'error' | 'done';
  content?: string;
  toolCall?: {
    id: string;
    name: string;
    arguments: string;
  };
  toolResult?: {
    id: string;
    name: string;
    result: unknown;
  };
  error?: string;
  usage?: { promptTokens: number; completionTokens: number; totalTokens: number };
}

export function encodeSSE(chunk: SSEChunk): string {
  return `data: ${JSON.stringify(chunk)}\n\n`;
}

export function encodeSSEDone(): string {
  return `data: [DONE]\n\n`;
}

interface OpenRouterStreamDelta {
  choices?: Array<{
    delta?: {
      content?: string | null;
      tool_calls?: Array<{
        index: number;
        id?: string;
        function?: {
          name?: string;
          arguments?: string;
        };
      }>;
    };
    finish_reason?: string | null;
  }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
}

export interface ParsedStreamEvent {
  content?: string;
  toolCalls?: Array<{
    index: number;
    id?: string;
    name?: string;
    arguments?: string;
  }>;
  finishReason?: string | null;
  usage?: { promptTokens: number; completionTokens: number; totalTokens: number };
}

export function parseSSEEvent(data: string): ParsedStreamEvent | null {
  if (data === '[DONE]') return null;

  try {
    const parsed: OpenRouterStreamDelta = JSON.parse(data);
    const choice = parsed.choices?.[0];
    if (!choice) return null;

    const result: ParsedStreamEvent = {};

    if (choice.delta?.content) {
      result.content = choice.delta.content;
    }

    if (choice.delta?.tool_calls?.length) {
      result.toolCalls = choice.delta.tool_calls.map(tc => ({
        index: tc.index,
        id: tc.id,
        name: tc.function?.name,
        arguments: tc.function?.arguments,
      }));
    }

    if (choice.finish_reason) {
      result.finishReason = choice.finish_reason;
    }

    if (parsed.usage) {
      result.usage = {
        promptTokens: parsed.usage.prompt_tokens ?? 0,
        completionTokens: parsed.usage.completion_tokens ?? 0,
        totalTokens: parsed.usage.total_tokens ?? 0,
      };
    }

    return result;
  } catch {
    return null;
  }
}

export async function* iterateSSEStream(
  stream: ReadableStream<Uint8Array>
): AsyncGenerator<ParsedStreamEvent> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data: ')) continue;

        const data = trimmed.slice(6);
        if (data === '[DONE]') return;

        const event = parseSSEEvent(data);
        if (event) yield event;
      }
    }
  } finally {
    reader.releaseLock();
  }
}
