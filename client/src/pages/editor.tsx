import { useState, useCallback, useRef, useEffect } from "react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { TopNavigation } from "@/components/TopNavigation";
import { ChatPanel } from "@/components/ChatPanel";
import { CodeEditor } from "@/components/CodeEditor";
import { PreviewPanel } from "@/components/PreviewPanel";
import { StatusBar } from "@/components/StatusBar";
import { SettingsDialog, type AISettings } from "@/components/SettingsDialog";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Document, ChatMessage } from "@shared/schema";

const DEFAULT_HTML = `<!DOCTYPE html>
<html>
<head>
  <title>My Document</title>
</head>
<body>
  <h1>Welcome to DocCraft AI</h1>
  <p>Start editing your document here. The AI assistant on the left can help you write, improve, and format your content.</p>
  
  <h2>Features</h2>
  <ul>
    <li>Real-time preview</li>
    <li>AI-powered editing assistance</li>
    <li>Multiple format support (HTML, LaTeX, RTF)</li>
    <li>Export to various formats</li>
  </ul>
  
  <blockquote>
    "The best way to predict the future is to create it."
  </blockquote>
  
  <h2>Getting Started</h2>
  <p>Try asking the AI to help you:</p>
  <ol>
    <li>Add a new section</li>
    <li>Improve your writing</li>
    <li>Convert to a different format</li>
  </ol>
</body>
</html>`;

const DEFAULT_LATEX = `\\documentclass{article}
\\usepackage{amsmath}
\\usepackage{amssymb}

\\title{My Document}
\\author{DocCraft AI}
\\date{\\today}

\\begin{document}

\\maketitle

\\section{Introduction}
Welcome to DocCraft AI. This is a LaTeX document with full math support.

\\section{Mathematics}
Here's the quadratic formula:
$$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$

And Euler's identity:
$$e^{i\\pi} + 1 = 0$$

\\section{Inline Math}
The area of a circle is $A = \\pi r^2$.

\\end{document}`;

const DEFAULT_RTF = `{\\rtf1\\ansi\\deff0
{\\fonttbl{\\f0\\froman Times New Roman;}}

\\f0\\fs24

{\\b Welcome to DocCraft AI}
\\par
\\par
This is a Rich Text Format document. RTF supports basic formatting like:
\\par
\\par
{\\b Bold text}
\\par
{\\i Italic text}
\\par
{\\ul Underlined text}
\\par
\\par
You can create documents that work across different word processors.
\\par
}`;

const SETTINGS_KEY = "doccraft_ai_settings";

function loadSettings(): AISettings {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error("Failed to load settings:", e);
  }
  return { apiKey: "", baseUrl: "", model: "gpt-4o" };
}

function saveSettings(settings: AISettings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error("Failed to save settings:", e);
  }
}

export default function EditorPage() {
  const [documentId, setDocumentId] = useState<number | null>(null);
  const [title, setTitle] = useState("Untitled Document");
  const [content, setContent] = useState(DEFAULT_HTML);
  const [format, setFormat] = useState<"html" | "latex" | "rtf">("html");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streamingContent, setStreamingContent] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [scrollPercentage, setScrollPercentage] = useState(0);
  const [isConnected, setIsConnected] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [aiSettings, setAiSettings] = useState<AISettings>(loadSettings);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const contentDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const titleDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: documents } = useQuery<Document[]>({
    queryKey: ["/api/documents"],
  });

  const createDocumentMutation = useMutation({
    mutationFn: async (data: { title: string; content: string; format: string }): Promise<Document> => {
      const res = await apiRequest("POST", "/api/documents", data);
      return res.json();
    },
    onSuccess: (doc: Document) => {
      setDocumentId(doc.id);
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
    },
  });

  const updateDocumentMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: { title?: string; content?: string; format?: string };
    }): Promise<Document> => {
      const res = await apiRequest("PATCH", `/api/documents/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
    },
  });

  useEffect(() => {
    if (!documentId && documents?.length) {
      const doc = documents[0];
      setDocumentId(doc.id);
      setTitle(doc.title);
      setContent(doc.content);
      setFormat(doc.format as "html" | "latex" | "rtf");
    }
  }, [documents, documentId]);

  const handleSaveSettings = useCallback((newSettings: AISettings) => {
    setAiSettings(newSettings);
    saveSettings(newSettings);
    toast({
      title: "Settings saved",
      description: `Using ${newSettings.model || "default model"}`,
    });
  }, [toast]);

  const handleFormatChange = useCallback(
    (newFormat: "html" | "latex" | "rtf") => {
      setFormat(newFormat);
      
      if (newFormat === "html" && !content.includes("<")) {
        setContent(DEFAULT_HTML);
      } else if (newFormat === "latex" && !content.includes("\\")) {
        setContent(DEFAULT_LATEX);
      } else if (newFormat === "rtf" && !content.includes("{\\rtf")) {
        setContent(DEFAULT_RTF);
      }

      if (documentId) {
        updateDocumentMutation.mutate({ id: documentId, data: { format: newFormat } });
      }
    },
    [content, documentId, updateDocumentMutation]
  );

  const handleContentChange = useCallback(
    (newContent: string) => {
      setContent(newContent);
      
      if (contentDebounceRef.current) {
        clearTimeout(contentDebounceRef.current);
      }

      if (documentId) {
        contentDebounceRef.current = setTimeout(() => {
          updateDocumentMutation.mutate({ id: documentId, data: { content: newContent } });
        }, 1000);
      }
    },
    [documentId, updateDocumentMutation]
  );

  useEffect(() => {
    return () => {
      if (contentDebounceRef.current) {
        clearTimeout(contentDebounceRef.current);
      }
    };
  }, []);

  const handleTitleChange = useCallback(
    (newTitle: string) => {
      setTitle(newTitle);
      
      if (titleDebounceRef.current) {
        clearTimeout(titleDebounceRef.current);
      }

      if (documentId) {
        titleDebounceRef.current = setTimeout(() => {
          updateDocumentMutation.mutate({ id: documentId, data: { title: newTitle } });
        }, 500);
      }
    },
    [documentId, updateDocumentMutation]
  );

  useEffect(() => {
    return () => {
      if (titleDebounceRef.current) {
        clearTimeout(titleDebounceRef.current);
      }
    };
  }, []);

  const handleUpload = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const formData = new FormData();
      formData.append("file", file);

      try {
        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) throw new Error("Upload failed");

        const data = await response.json();
        setContent(data.content);
        setTitle(file.name.replace(/\.[^/.]+$/, ""));
        toast({
          title: "File uploaded",
          description: `Successfully processed ${file.name}`,
        });
      } catch (error) {
        toast({
          title: "Upload failed",
          description: "Could not process the file. Please try a different format.",
          variant: "destructive",
        });
      }

      e.target.value = "";
    },
    [toast]
  );

  const handleExport = useCallback(() => {
    const extension = format === "latex" ? "tex" : format;
    const mimeType =
      format === "html"
        ? "text/html"
        : format === "latex"
        ? "application/x-latex"
        : "application/rtf";

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title || "document"}.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Document exported",
      description: `Saved as ${title}.${extension}`,
    });
  }, [content, format, title, toast]);

  const handleSendMessage = useCallback(
    async (messageContent: string) => {
      let currentDocId = documentId;
      
      if (!currentDocId) {
        const doc = await createDocumentMutation.mutateAsync({
          title,
          content,
          format,
        });
        currentDocId = doc.id;
        setDocumentId(doc.id);
      }

      const userMessage: ChatMessage = {
        id: Date.now(),
        documentId: currentDocId,
        role: "user",
        content: messageContent,
        createdAt: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsAiLoading(true);
      setStreamingContent("");
      setIsConnected(true);

      try {
        const response = await fetch(`/api/documents/${currentDocId}/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: messageContent,
            documentContent: content,
            format,
            apiKey: aiSettings.apiKey || undefined,
            baseUrl: aiSettings.baseUrl || undefined,
            model: aiSettings.model || undefined,
          }),
        });

        if (!response.ok) throw new Error("Failed to send message");

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No response body");

        const decoder = new TextDecoder();
        let buffer = "";
        let fullResponse = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            
            const jsonStr = line.slice(6).trim();
            if (!jsonStr) continue;

            try {
              const data = JSON.parse(jsonStr);
              
              if (data.content) {
                fullResponse += data.content;
                setStreamingContent(fullResponse);
              }
              
              if (data.documentUpdate) {
                setContent(data.documentUpdate);
                toast({
                  title: "Document updated",
                  description: "AI has applied changes to your document",
                });
              }
              
              if (data.done) {
                const assistantMessage: ChatMessage = {
                  id: Date.now() + 1,
                  documentId: currentDocId,
                  role: "assistant",
                  content: fullResponse,
                  createdAt: new Date(),
                };
                setMessages((prev) => [...prev, assistantMessage]);
                setStreamingContent("");
              }
              
              if (data.error) {
                throw new Error(data.error);
              }
            } catch (parseError) {
              if (parseError instanceof SyntaxError) {
                continue;
              }
              throw parseError;
            }
          }
        }
      } catch (error) {
        console.error("Chat error:", error);
        toast({
          title: "Message failed",
          description: "Could not send message to AI. Please check your settings.",
          variant: "destructive",
        });
        setIsConnected(false);
        setStreamingContent("");
      } finally {
        setIsAiLoading(false);
      }
    },
    [documentId, content, format, title, createDocumentMutation, toast, aiSettings]
  );

  const handleEditorScroll = useCallback((scrollTop: number, maxScroll: number) => {
    if (maxScroll > 0) {
      setScrollPercentage(scrollTop / maxScroll);
    }
  }, []);

  const documentSize = new Blob([content]).size;
  const lineCount = content.split("\n").length;
  const characterCount = content.length;

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden bg-background">
      <TopNavigation
        format={format}
        onFormatChange={handleFormatChange}
        onUpload={handleUpload}
        onExport={handleExport}
        documentTitle={title}
        onTitleChange={handleTitleChange}
      />

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept=".doc,.docx,.txt,.html,.tex,.rtf"
        className="hidden"
        data-testid="input-file-upload"
      />

      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          <ResizablePanel defaultSize={35} minSize={20} maxSize={50}>
            <ChatPanel
              messages={messages}
              onSendMessage={handleSendMessage}
              isLoading={isAiLoading}
              streamingContent={streamingContent}
              documentContent={content}
              onOpenSettings={() => setSettingsOpen(true)}
            />
          </ResizablePanel>

          <ResizableHandle className="w-1.5 bg-border hover:bg-primary/50 transition-colors" />

          <ResizablePanel defaultSize={40} minSize={25}>
            <CodeEditor
              content={content}
              onChange={handleContentChange}
              format={format}
              onScrollChange={handleEditorScroll}
            />
          </ResizablePanel>

          <ResizableHandle className="w-1.5 bg-border hover:bg-primary/50 transition-colors" />

          <ResizablePanel defaultSize={25} minSize={15} maxSize={40}>
            <PreviewPanel
              content={content}
              format={format}
              scrollPercentage={scrollPercentage}
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      <StatusBar
        isConnected={isConnected}
        documentSize={documentSize}
        format={format}
        lineCount={lineCount}
        characterCount={characterCount}
      />

      <SettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        settings={aiSettings}
        onSave={handleSaveSettings}
      />
    </div>
  );
}
