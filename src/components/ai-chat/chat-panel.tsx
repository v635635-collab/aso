"use client";

import { useEffect, useRef, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
  PlusIcon,
  Trash2Icon,
  MessageSquareIcon,
  ChevronDownIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useChat } from "./chat-provider";
import { ChatMessage } from "./chat-message";
import { ChatInput } from "./chat-input";
import { ToolCallCard } from "./tool-call-card";

interface ChatPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ChatPanel({ open, onOpenChange }: ChatPanelProps) {
  const {
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
  } = useChat();

  const [showSessions, setShowSessions] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    if (!currentSession && sessions.length > 0) {
      switchSession(sessions[0].id);
    }
  }, [open, currentSession, sessions, switchSession]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const viewport = el.querySelector("[data-slot='scroll-area-viewport']");
    if (viewport) {
      viewport.scrollTop = viewport.scrollHeight;
    }
  }, [messages, activeToolCalls, isStreaming]);

  const handleNewChat = async () => {
    await createSession();
    setShowSessions(false);
  };

  const handleSend = async (content: string) => {
    if (!currentSession) {
      const session = await createSession();
      if (!session) return;
    }
    sendMessage(content);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        showCloseButton
        className="flex w-full flex-col gap-0 p-0 sm:max-w-md"
      >
        <SheetHeader className="border-b px-4 py-3">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-base">ASO Assistant</SheetTitle>
            <Button
              size="icon-xs"
              variant="ghost"
              onClick={handleNewChat}
              title="New chat"
            >
              <PlusIcon className="size-4" />
            </Button>
          </div>
          <SheetDescription className="sr-only">
            AI-powered ASO assistant
          </SheetDescription>

          {sessions.length > 1 && (
            <div className="mt-1">
              <button
                type="button"
                onClick={() => setShowSessions(!showSessions)}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <MessageSquareIcon className="size-3" />
                <span className="truncate max-w-[200px]">
                  {currentSession?.title || "New Chat"}
                </span>
                <ChevronDownIcon
                  className={cn(
                    "size-3 transition-transform",
                    showSessions && "rotate-180"
                  )}
                />
              </button>

              {showSessions && (
                <div className="mt-2 max-h-40 overflow-auto space-y-0.5 rounded-lg border bg-muted/30 p-1">
                  {sessions.map((session) => (
                    <div
                      key={session.id}
                      className={cn(
                        "group flex items-center gap-2 rounded-md px-2 py-1.5 text-xs cursor-pointer transition-colors",
                        session.id === currentSession?.id
                          ? "bg-primary/10 text-primary"
                          : "hover:bg-muted"
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          switchSession(session.id);
                          setShowSessions(false);
                        }}
                        className="flex-1 truncate text-left"
                      >
                        {session.title || "New Chat"}
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteSession(session.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                      >
                        <Trash2Icon className="size-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </SheetHeader>

        <ScrollArea ref={scrollRef} className="flex-1 overflow-hidden">
          <div className="min-h-full flex flex-col justify-end">
            {isLoading && (
              <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
                Loading messages...
              </div>
            )}

            {!isLoading && messages.length === 0 && (
              <div className="flex flex-col items-center justify-center gap-3 py-12 text-muted-foreground">
                <MessageSquareIcon className="size-8 opacity-40" />
                <p className="text-sm">Start a conversation with the ASO assistant</p>
                <p className="text-xs max-w-[250px] text-center opacity-70">
                  Ask about keywords, apps, campaigns, positions, or trends
                </p>
              </div>
            )}

            {messages
              .filter((m) => m.role !== "TOOL" && m.role !== "SYSTEM")
              .map((msg) => (
                <ChatMessage key={msg.id} message={msg} />
              ))}

            {activeToolCalls.length > 0 && (
              <div className="px-4">
                {activeToolCalls.map((tc) => (
                  <ToolCallCard key={tc.id} toolCall={tc} />
                ))}
              </div>
            )}

            {error && (
              <div className="mx-4 my-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                {error}
              </div>
            )}
          </div>
        </ScrollArea>

        <ChatInput
          onSend={handleSend}
          isStreaming={isStreaming}
          onStop={stopStreaming}
        />
      </SheetContent>
    </Sheet>
  );
}
