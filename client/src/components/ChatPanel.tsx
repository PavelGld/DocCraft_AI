import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Loader2, Sparkles, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@shared/schema";

interface ChatPanelProps {
  messages: ChatMessage[];
  onSendMessage: (content: string) => void;
  isLoading: boolean;
  streamingContent: string;
  documentContent: string;
  onOpenSettings?: () => void;
}

export function ChatPanel({
  messages,
  onSendMessage,
  isLoading,
  streamingContent,
  documentContent,
  onOpenSettings,
}: ChatPanelProps) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streamingContent]);

  const handleSubmit = () => {
    if (input.trim() && !isLoading) {
      onSendMessage(input.trim());
      setInput("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const cleanContent = (content: string) => {
    return content.replace(/<<<DOCUMENT_UPDATE>>>[\s\S]*?<<<END_UPDATE>>>/g, "").trim();
  };

  return (
    <div className="flex flex-col h-full bg-sidebar text-sidebar-foreground">
      <div className="h-11 border-b border-sidebar-border flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">AI Assistant</span>
        </div>
        {onOpenSettings && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onOpenSettings}
            data-testid="button-open-settings"
          >
            <Settings className="h-4 w-4" />
          </Button>
        )}
      </div>

      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.length === 0 && !streamingContent && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-12 h-12 rounded-full bg-sidebar-accent flex items-center justify-center mb-4">
                <Bot className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-sm font-medium text-sidebar-foreground mb-2">
                Document Assistant
              </h3>
              <p className="text-xs text-muted-foreground max-w-[200px]">
                Ask me to help you write, edit, or improve your document. I can see your current draft and will apply changes directly.
              </p>
            </div>
          )}

          {messages.map((message) => (
            <ChatMessageItem key={message.id} message={message} cleanContent={cleanContent} />
          ))}

          {streamingContent && (
            <div className="flex gap-3">
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Bot className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 chat-message-assistant rounded-lg p-3 text-sm">
                <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                  {cleanContent(streamingContent)}
                </div>
              </div>
            </div>
          )}

          {isLoading && !streamingContent && (
            <div className="flex gap-3">
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Bot className="h-4 w-4 text-primary" />
              </div>
              <div className="chat-message-assistant rounded-lg px-4 py-3">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-3 border-t border-sidebar-border">
        <div className="flex gap-2 items-end">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask the AI to help with your document..."
            className="flex-1 bg-sidebar-accent text-sidebar-foreground placeholder:text-muted-foreground rounded-lg text-sm resize-none min-h-[44px] max-h-[120px]"
            rows={1}
            disabled={isLoading}
            data-testid="input-chat-message"
          />
          <Button
            type="button"
            size="icon"
            onClick={handleSubmit}
            disabled={!input.trim() || isLoading}
            className="shrink-0 h-[44px] w-[44px]"
            data-testid="button-send-message"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground mt-2 px-1">
          AI can see your document and will apply edits directly. Press Enter to send.
        </p>
      </div>
    </div>
  );
}

function ChatMessageItem({ message, cleanContent }: { message: ChatMessage; cleanContent: (s: string) => string }) {
  const isUser = message.role === "user";
  const displayContent = isUser ? message.content : cleanContent(message.content);

  return (
    <div className={cn("flex gap-3", isUser && "flex-row-reverse")}>
      <div
        className={cn(
          "w-7 h-7 rounded-full flex items-center justify-center shrink-0",
          isUser ? "bg-primary" : "bg-primary/10"
        )}
      >
        {isUser ? (
          <User className="h-4 w-4 text-primary-foreground" />
        ) : (
          <Bot className="h-4 w-4 text-primary" />
        )}
      </div>
      <div
        className={cn(
          "flex-1 rounded-lg p-3 text-sm max-w-[85%]",
          isUser ? "chat-message-user" : "chat-message-assistant"
        )}
      >
        <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
          {displayContent}
        </div>
      </div>
    </div>
  );
}
