import { useRef, useEffect, useCallback, useState } from "react";
import { Eye, RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PreviewPanelProps {
  content: string;
  format: "html" | "latex" | "rtf";
  scrollPercentage?: number;
}

export function PreviewPanel({ content, format, scrollPercentage }: PreviewPanelProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const renderContent = useCallback(() => {
    setIsLoading(true);
    setError(null);

    try {
      if (format === "html") {
        renderHtml(content);
      } else if (format === "latex") {
        renderLatex(content);
      } else if (format === "rtf") {
        renderRtf(content);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to render preview");
    } finally {
      setIsLoading(false);
    }
  }, [content, format]);

  const renderHtml = (htmlContent: string) => {
    if (!iframeRef.current) return;

    const styledHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 15px;
      line-height: 1.7;
      color: #e5e7eb;
      background: #1a1b1e;
      padding: 24px;
      min-width: max-content;
    }
    h1, h2, h3, h4, h5, h6 {
      color: #f3f4f6;
      margin-bottom: 0.75em;
      margin-top: 1.25em;
      font-weight: 600;
      line-height: 1.3;
    }
    h1 { font-size: 2em; }
    h2 { font-size: 1.5em; }
    h3 { font-size: 1.25em; }
    p { margin-bottom: 1em; }
    a { color: #60a5fa; text-decoration: underline; }
    ul, ol { padding-left: 1.5em; margin-bottom: 1em; }
    li { margin-bottom: 0.25em; }
    code {
      font-family: 'JetBrains Mono', monospace;
      background: #27272a;
      padding: 0.15em 0.4em;
      border-radius: 4px;
      font-size: 0.9em;
    }
    pre {
      background: #18181b;
      padding: 1em;
      border-radius: 8px;
      overflow-x: auto;
      margin-bottom: 1em;
    }
    pre code {
      background: none;
      padding: 0;
    }
    blockquote {
      border-left: 3px solid #3b82f6;
      padding-left: 1em;
      margin: 1em 0;
      color: #9ca3af;
      font-style: italic;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 1em;
    }
    th, td {
      border: 1px solid #374151;
      padding: 0.5em 0.75em;
      text-align: left;
    }
    th {
      background: #27272a;
      font-weight: 600;
    }
    img {
      max-width: 100%;
      height: auto;
      border-radius: 8px;
    }
    hr {
      border: none;
      border-top: 1px solid #374151;
      margin: 1.5em 0;
    }
  </style>
</head>
<body>
  ${htmlContent || '<p style="color: #6b7280; text-align: center; padding: 2em;">Start typing to see your preview...</p>'}
</body>
</html>`;

    const blob = new Blob([styledHtml], { type: "text/html" });
    iframeRef.current.src = URL.createObjectURL(blob);
  };

  const renderLatex = (latexContent: string) => {
    if (!iframeRef.current) return;

    const latexHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
  <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"></script>
  <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js"></script>
  <style>
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      font-size: 15px;
      line-height: 1.8;
      color: #e5e7eb;
      background: #1a1b1e;
      padding: 24px;
      min-width: max-content;
    }
    .katex { font-size: 1.1em; }
    .katex-display { margin: 1em 0; overflow-x: auto; }
    h1, h2, h3 { color: #f3f4f6; margin-top: 1.25em; margin-bottom: 0.5em; }
    p { margin-bottom: 1em; }
  </style>
</head>
<body>
  <div id="content">${escapeHtml(latexContent) || '<p style="color: #6b7280; text-align: center;">Enter LaTeX content to preview...</p>'}</div>
  <script>
    document.addEventListener("DOMContentLoaded", function() {
      if (window.renderMathInElement) {
        renderMathInElement(document.getElementById("content"), {
          delimiters: [
            {left: "$$", right: "$$", display: true},
            {left: "$", right: "$", display: false},
            {left: "\\\\[", right: "\\\\]", display: true},
            {left: "\\\\(", right: "\\\\)", display: false}
          ],
          throwOnError: false
        });
      }
    });
  </script>
</body>
</html>`;

    const blob = new Blob([latexHtml], { type: "text/html" });
    iframeRef.current.src = URL.createObjectURL(blob);
  };

  const renderRtf = (rtfContent: string) => {
    if (!iframeRef.current) return;

    const plainText = rtfContent
      .replace(/\\par\b/g, "\n\n")
      .replace(/\\tab\b/g, "    ")
      .replace(/\\b\b/g, "")
      .replace(/\\b0\b/g, "")
      .replace(/\\i\b/g, "")
      .replace(/\\i0\b/g, "")
      .replace(/\{[^}]*\}/g, "")
      .replace(/\\[a-z]+\d*\s?/gi, "")
      .trim();

    const rtfHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: 'Times New Roman', Georgia, serif;
      font-size: 16px;
      line-height: 1.8;
      color: #e5e7eb;
      background: #1a1b1e;
      padding: 24px;
      min-width: max-content;
      white-space: pre-wrap;
    }
  </style>
</head>
<body>${plainText || '<p style="color: #6b7280; text-align: center;">Enter RTF content to preview...</p>'}</body>
</html>`;

    const blob = new Blob([rtfHtml], { type: "text/html" });
    iframeRef.current.src = URL.createObjectURL(blob);
  };

  useEffect(() => {
    const debounceTimer = setTimeout(renderContent, 150);
    return () => clearTimeout(debounceTimer);
  }, [renderContent]);

  useEffect(() => {
    if (
      scrollPercentage !== undefined &&
      iframeRef.current?.contentWindow
    ) {
      const doc = iframeRef.current.contentDocument;
      if (doc) {
        const maxScroll = doc.body.scrollHeight - doc.documentElement.clientHeight;
        doc.documentElement.scrollTop = maxScroll * scrollPercentage;
      }
    }
  }, [scrollPercentage]);

  const handleRefresh = () => {
    renderContent();
  };

  return (
    <div className="flex flex-col h-full bg-card" ref={containerRef}>
      <div className="h-11 border-b border-card-border flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-2">
          <Eye className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">Preview</span>
          {isLoading && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleRefresh}
          className="h-7 w-7"
          data-testid="button-refresh-preview"
        >
          <RefreshCw className="h-3 w-3" />
        </Button>
      </div>

      <div className="flex-1 overflow-auto">
        {error ? (
          <div className="flex items-center justify-center h-full p-4">
            <div className="text-center">
              <p className="text-destructive text-sm mb-2">Preview Error</p>
              <p className="text-muted-foreground text-xs">{error}</p>
            </div>
          </div>
        ) : (
          <iframe
            ref={iframeRef}
            className="w-full h-full border-0"
            sandbox={format === "latex" ? "allow-scripts allow-same-origin" : ""}
            title="Document Preview"
            data-testid="iframe-preview"
          />
        )}
      </div>
    </div>
  );
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
    .replace(/\n/g, "<br>");
}
