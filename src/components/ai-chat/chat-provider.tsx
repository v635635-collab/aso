"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useAIChat, type ChatMessage, type ToolCallEvent } from "@/hooks/use-ai-chat";

interface ChatContextValue {
  sessions: Array<{
    id: string;
    title: string | null;
    messageCount: number;
    lastMessageAt: string | null;
    createdAt: string;
    isArchived: boolean;
  }>;
  currentSession: {
    id: string;
    title: string | null;
    model: string;
    messageCount: number;
  } | null;
  messages: ChatMessage[];
  activeToolCalls: ToolCallEvent[];
  isStreaming: boolean;
  isLoading: boolean;
  error: string | null;
  sendMessage: (content: string) => Promise<void>;
  createSession: (opts?: {
    title?: string;
    appId?: string;
    nicheId?: string;
  }) => Promise<unknown>;
  switchSession: (sessionId: string) => Promise<void>;
  deleteSession: (sessionId: string) => Promise<void>;
  stopStreaming: () => void;
}

const ChatContext = createContext<ChatContextValue | null>(null);

export function ChatProvider({ children }: { children: ReactNode }) {
  const chat = useAIChat();

  return <ChatContext.Provider value={chat}>{children}</ChatContext.Provider>;
}

export function useChat(): ChatContextValue {
  const ctx = useContext(ChatContext);
  if (!ctx) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return ctx;
}
