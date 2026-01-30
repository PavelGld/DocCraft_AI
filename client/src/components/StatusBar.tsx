import { Wifi, WifiOff, FileText } from "lucide-react";

interface StatusBarProps {
  isConnected: boolean;
  documentSize: number;
  format: "html" | "latex" | "rtf";
  lineCount: number;
  characterCount: number;
}

export function StatusBar({
  isConnected,
  documentSize,
  format,
  lineCount,
  characterCount,
}: StatusBarProps) {
  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <footer className="h-7 bg-sidebar border-t border-sidebar-border flex items-center justify-between px-4 text-xs text-sidebar-foreground/70 shrink-0">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2" data-testid="status-ai-connection">
          {isConnected ? (
            <>
              <div className="status-indicator connected" />
              <span>AI Connected</span>
            </>
          ) : (
            <>
              <div className="status-indicator disconnected" />
              <span>AI Disconnected</span>
            </>
          )}
        </div>
        <div className="h-3 w-px bg-sidebar-border" />
        <div className="flex items-center gap-1.5">
          <FileText className="h-3 w-3" />
          <span>{format.toUpperCase()}</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <span data-testid="status-line-count">Lines: {lineCount}</span>
        <span data-testid="status-char-count">Chars: {characterCount.toLocaleString()}</span>
        <span data-testid="status-doc-size">Size: {formatSize(documentSize)}</span>
      </div>
    </footer>
  );
}
