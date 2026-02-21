export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
}

export interface AIGenerationResult {
  content: string;
  model: string;
  tokenCount: number;
  cost: number;
  latencyMs: number;
}

export interface TitleGenerationInput {
  appId: string;
  keywords: string[];
  maxLength: number;
  locale: string;
  constraints?: string[];
}

export interface PushPlanGenerationInput {
  appId: string;
  targetKeywords: string[];
  budget: number;
  strategy: string;
  durationDays: number;
}
