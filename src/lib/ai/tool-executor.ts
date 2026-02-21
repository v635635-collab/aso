import { AI_TOOLS_MAP } from './tools';

export async function executeToolCall(
  name: string,
  args: Record<string, unknown>
): Promise<unknown> {
  const tool = AI_TOOLS_MAP.get(name);
  if (!tool) {
    throw new Error(`Unknown tool: ${name}`);
  }

  try {
    const result = await tool.execute(args);
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Tool execution failed';
    throw new Error(`Tool "${name}" failed: ${message}`);
  }
}
