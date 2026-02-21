export interface AIToolParameter {
  type: string;
  description: string;
  enum?: string[];
}

export interface AIToolParameters {
  type: 'object';
  properties: Record<string, AIToolParameter>;
  required?: string[];
}

export interface AITool {
  name: string;
  description: string;
  parameters: AIToolParameters;
  execute: (args: Record<string, unknown>) => Promise<unknown>;
}

export interface AIToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
  result?: unknown;
  error?: string;
}

export function formatToolForOpenRouter(tool: AITool) {
  return {
    type: 'function' as const,
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
    },
  };
}
