import { useRef, useCallback } from "react";
import { Code2, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface CodeEditorProps {
  content: string;
  onChange: (content: string) => void;
  format: "html" | "latex" | "rtf";
  onScrollChange?: (scrollTop: number, scrollHeight: number) => void;
}

export function CodeEditor({
  content,
  onChange,
  format,
  onScrollChange,
}: CodeEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  const lineCount = content.split("\n").length;

  const handleScroll = useCallback(() => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
      
      if (onScrollChange) {
        onScrollChange(
          textareaRef.current.scrollTop,
          textareaRef.current.scrollHeight - textareaRef.current.clientHeight
        );
      }
    }
  }, [onScrollChange]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const start = e.currentTarget.selectionStart;
      const end = e.currentTarget.selectionEnd;
      const newContent = content.substring(0, start) + "  " + content.substring(end);
      onChange(newContent);
      
      requestAnimationFrame(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 2;
        }
      });
    }
  };

  return (
    <div className="flex flex-col h-full bg-card">
      <div className="h-11 border-b border-card-border flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-2">
          <Code2 className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">Editor</span>
          <span className="text-xs text-muted-foreground px-2 py-0.5 bg-muted rounded">
            {format.toUpperCase()}
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="gap-2 h-7"
          data-testid="button-copy-code"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3" />
              <span className="text-xs">Copied</span>
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" />
              <span className="text-xs">Copy</span>
            </>
          )}
        </Button>
      </div>

      <div className="flex-1 flex overflow-hidden min-h-0">
        <div
          ref={lineNumbersRef}
          className="w-12 bg-muted/50 text-muted-foreground text-right py-4 pr-3 font-mono text-sm leading-6 select-none overflow-hidden border-r border-border"
        >
          {Array.from({ length: lineCount }, (_, i) => (
            <div key={i + 1} className="h-6">
              {i + 1}
            </div>
          ))}
        </div>

        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => onChange(e.target.value)}
          onScroll={handleScroll}
          onKeyDown={handleKeyDown}
          className="flex-1 p-4 font-mono text-sm leading-6 bg-transparent text-foreground resize-none outline-none code-editor overflow-auto"
          spellCheck={false}
          data-testid="textarea-code-editor"
        />
      </div>
    </div>
  );
}
