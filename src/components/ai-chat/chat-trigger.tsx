"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { BotMessageSquareIcon } from "lucide-react";
import { ChatProvider } from "./chat-provider";
import { ChatPanel } from "./chat-panel";

export function ChatTrigger() {
  const [open, setOpen] = useState(false);

  return (
    <ChatProvider>
      <Button
        size="icon-lg"
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 rounded-full shadow-lg hover:shadow-xl transition-shadow"
        title="ASO Assistant"
      >
        <BotMessageSquareIcon className="size-5" />
      </Button>
      <ChatPanel open={open} onOpenChange={setOpen} />
    </ChatProvider>
  );
}
