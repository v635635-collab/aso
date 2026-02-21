"use client";

import { useRef, useState, useCallback, type KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { SendHorizonalIcon, SquareIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSend: (message: string) => void;
  isStreaming: boolean;
  onStop: () => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, isStreaming, onStop, disabled }: ChatInputProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [value, onSend, disabled]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        if (!isStreaming) handleSend();
      }
    },
    [handleSend, isStreaming]
  );

  const handleInput = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  }, []);

  return (
    <div className="border-t bg-background p-3">
      <div className="relative flex items-end gap-2">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            handleInput();
          }}
          onKeyDown={handleKeyDown}
          placeholder="Ask the ASO assistant..."
          disabled={disabled}
          rows={1}
          className={cn(
            "flex-1 resize-none rounded-xl border border-input bg-muted/30 px-4 py-2.5 text-sm",
            "placeholder:text-muted-foreground",
            "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
            "outline-none transition-all",
            "min-h-[40px] max-h-[160px]",
            "dark:bg-input/30"
          )}
        />

        {isStreaming ? (
          <Button
            size="icon"
            variant="destructive"
            onClick={onStop}
            className="shrink-0 rounded-xl"
          >
            <SquareIcon className="size-4" />
          </Button>
        ) : (
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!value.trim() || disabled}
            className="shrink-0 rounded-xl"
          >
            <SendHorizonalIcon className="size-4" />
          </Button>
        )}
      </div>
      <p className="mt-1.5 text-center text-[10px] text-muted-foreground">
        Enter to send, Shift+Enter for newline
      </p>
    </div>
  );
}
