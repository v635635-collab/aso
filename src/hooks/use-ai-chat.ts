"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { SSEChunk } from "@/lib/ai/streaming";

interface ChatSession {
  id: string;
  title: string | null;
  model: string;
  messageCount: number;
  totalTokens: number;
  lastMessageAt: string | null;
  createdAt: string;
  isArchived: boolean;
  context: Record<string, string>;
}

export interface ChatMessage {
  id: string;
  role: "USER" | "ASSISTANT" | "TOOL" | "SYSTEM";
  content: string;
  toolCalls?: unknown;
  tokenCount?: number;
  model?: string;
  latencyMs?: number;
  createdAt: string;
  isStreaming?: boolean;
}

export interface ToolCallEvent {
  id: string;
  name: string;
  arguments: string;
  result?: unknown;
  isExecuting?: boolean;
}

export function useAIChat() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeToolCalls, setActiveToolCalls] = useState<ToolCallEvent[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  const fetchSessions = useCallback(async () => {
    try {
      const res = await fetch("/api/chat/sessions", { credentials: "include" });
      const json = await res.json();
      if (json.success) setSessions(json.data);
    } catch {
      // Silently fail — sessions list is not critical
    }
  }, []);

  const fetchMessages = useCallback(async (sessionId: string) => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/chat/sessions/${sessionId}`, {
        credentials: "include",
      });
      const json = await res.json();
      if (json.success) {
        setMessages(
          json.data.messages.map((m: ChatMessage) => ({
            ...m,
            isStreaming: false,
          }))
        );
      }
    } catch {
      setError("Failed to load messages");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createSession = useCallback(
    async (opts?: { title?: string; appId?: string; nicheId?: string }) => {
      try {
        const res = await fetch("/api/chat/sessions", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(opts ?? {}),
        });
        const json = await res.json();
        if (json.success) {
          const session = json.data as ChatSession;
          setSessions((prev) => [session, ...prev]);
          setCurrentSession(session);
          setMessages([]);
          setError(null);
          return session;
        }
      } catch {
        setError("Failed to create session");
      }
      return null;
    },
    []
  );

  const switchSession = useCallback(
    async (sessionId: string) => {
      const session = sessions.find((s) => s.id === sessionId);
      if (session) {
        setCurrentSession(session);
        await fetchMessages(sessionId);
        setError(null);
      }
    },
    [sessions, fetchMessages]
  );

  const deleteSession = useCallback(
    async (sessionId: string) => {
      try {
        await fetch(`/api/chat/sessions/${sessionId}`, {
          method: "DELETE",
          credentials: "include",
        });
        setSessions((prev) => prev.filter((s) => s.id !== sessionId));
        if (currentSession?.id === sessionId) {
          setCurrentSession(null);
          setMessages([]);
        }
      } catch {
        setError("Failed to delete session");
      }
    },
    [currentSession]
  );

  const stopStreaming = useCallback(() => {
    abortRef.current?.abort();
    setIsStreaming(false);
  }, []);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!currentSession || isStreaming) return;

      setError(null);

      const userMsg: ChatMessage = {
        id: `temp-${Date.now()}`,
        role: "USER",
        content,
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMsg]);

      const assistantMsg: ChatMessage = {
        id: `temp-assistant-${Date.now()}`,
        role: "ASSISTANT",
        content: "",
        createdAt: new Date().toISOString(),
        isStreaming: true,
      };

      setMessages((prev) => [...prev, assistantMsg]);
      setIsStreaming(true);
      setActiveToolCalls([]);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch(
          `/api/chat/sessions/${currentSession.id}/messages`,
          {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content }),
            signal: controller.signal,
          }
        );

        if (!res.ok || !res.body) {
          throw new Error("Failed to send message");
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data: ")) continue;
            const data = trimmed.slice(6);
            if (data === "[DONE]") break;

            try {
              const chunk: SSEChunk = JSON.parse(data);

              if (chunk.type === "content" && chunk.content) {
                setMessages((prev) => {
                  const updated = [...prev];
                  const lastMsg = updated[updated.length - 1];
                  if (lastMsg?.role === "ASSISTANT" && lastMsg.isStreaming) {
                    updated[updated.length - 1] = {
                      ...lastMsg,
                      content: lastMsg.content + chunk.content,
                    };
                  }
                  return updated;
                });
              }

              if (chunk.type === "tool_call_start" && chunk.toolCall) {
                setActiveToolCalls((prev) => [
                  ...prev,
                  {
                    id: chunk.toolCall!.id,
                    name: chunk.toolCall!.name,
                    arguments: chunk.toolCall!.arguments,
                    isExecuting: true,
                  },
                ]);
              }

              if (chunk.type === "tool_call_result" && chunk.toolResult) {
                setActiveToolCalls((prev) =>
                  prev.map((tc) =>
                    tc.id === chunk.toolResult!.id
                      ? { ...tc, result: chunk.toolResult!.result, isExecuting: false }
                      : tc
                  )
                );
              }

              if (chunk.type === "error") {
                setError(chunk.error ?? "An error occurred");
              }

              if (chunk.type === "done") {
                setMessages((prev) => {
                  const updated = [...prev];
                  const lastMsg = updated[updated.length - 1];
                  if (lastMsg?.role === "ASSISTANT" && lastMsg.isStreaming) {
                    updated[updated.length - 1] = {
                      ...lastMsg,
                      isStreaming: false,
                    };
                  }
                  return updated;
                });
              }
            } catch {
              // Skip malformed JSON chunks
            }
          }
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError(err instanceof Error ? err.message : "Failed to send message");
        setMessages((prev) => prev.filter((m) => !m.isStreaming));
      } finally {
        setIsStreaming(false);
        abortRef.current = null;
        fetchSessions();
      }
    },
    [currentSession, isStreaming, fetchSessions]
  );

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  return {
    sessions,
    currentSession,
    messages,
    activeToolCalls,
    isStreaming,
    isLoading,
    error,
    sendMessage,
    createSession,
    switchSession,
    deleteSession,
    stopStreaming,
    fetchSessions,
  };
}
