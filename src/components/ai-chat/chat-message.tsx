"use client";

import { memo, useMemo } from "react";
import { cn } from "@/lib/utils";
import { BotIcon, UserIcon } from "lucide-react";
import type { ChatMessage as ChatMessageType } from "@/hooks/use-ai-chat";

function renderMarkdown(text: string): string {
  let html = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Code blocks
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_m, _lang, code) => {
    return `<pre class="my-2 rounded-md bg-muted p-3 text-xs overflow-auto"><code>${code.trim()}</code></pre>`;
  });

  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code class="rounded bg-muted px-1.5 py-0.5 text-xs">$1</code>');

  // Bold
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");

  // Italic
  html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");

  // Unordered lists
  html = html.replace(/^[-•] (.+)$/gm, '<li class="ml-4">$1</li>');
  html = html.replace(
    /(<li[^>]*>.*?<\/li>\n?)+/g,
    '<ul class="my-1 list-disc space-y-0.5">$&</ul>'
  );

  // Ordered lists
  html = html.replace(/^\d+\. (.+)$/gm, '<li class="ml-4">$1</li>');

  // Line breaks
  html = html.replace(/\n/g, "<br/>");

  return html;
}

function ChatMessageComponent({ message }: { message: ChatMessageType }) {
  const isUser = message.role === "USER";
  const isAssistant = message.role === "ASSISTANT";

  const renderedContent = useMemo(() => {
    if (!message.content) return "";
    return renderMarkdown(message.content);
  }, [message.content]);

  if (message.role === "TOOL" || message.role === "SYSTEM") return null;

  return (
    <div
      className={cn(
        "flex gap-3 px-4 py-3",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      <div
        className={cn(
          "flex size-7 shrink-0 items-center justify-center rounded-full",
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground"
        )}
      >
        {isUser ? (
          <UserIcon className="size-3.5" />
        ) : (
          <BotIcon className="size-3.5" />
        )}
      </div>

      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-foreground"
        )}
      >
        {message.isStreaming && !message.content && (
          <div className="flex items-center gap-1.5">
            <span className="size-1.5 animate-pulse rounded-full bg-current" />
            <span className="size-1.5 animate-pulse rounded-full bg-current [animation-delay:150ms]" />
            <span className="size-1.5 animate-pulse rounded-full bg-current [animation-delay:300ms]" />
          </div>
        )}

        {message.content && (
          <div
            className={cn(
              "prose prose-sm max-w-none",
              isAssistant
                ? "prose-neutral dark:prose-invert"
                : "prose-invert"
            )}
            dangerouslySetInnerHTML={{ __html: renderedContent }}
          />
        )}

        {message.isStreaming && message.content && (
          <span className="inline-block size-1.5 animate-pulse rounded-full bg-current ml-0.5 align-middle" />
        )}
      </div>
    </div>
  );
}

export const ChatMessage = memo(ChatMessageComponent);
