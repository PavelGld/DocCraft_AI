import { Upload, Download, FileText, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "./ThemeToggle";

interface TopNavigationProps {
  format: "html" | "latex" | "rtf";
  onFormatChange: (format: "html" | "latex" | "rtf") => void;
  onUpload: () => void;
  onExport: () => void;
  documentTitle: string;
  onTitleChange: (title: string) => void;
}

const formatLabels = {
  html: "HTML",
  latex: "LaTeX",
  rtf: "RTF",
};

export function TopNavigation({
  format,
  onFormatChange,
  onUpload,
  onExport,
  documentTitle,
  onTitleChange,
}: TopNavigationProps) {
  return (
    <header className="h-12 border-b border-border bg-card flex items-center justify-between px-4 gap-4 shrink-0">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          <span className="font-semibold text-foreground">DocCraft AI</span>
        </div>
        <div className="h-4 w-px bg-border" />
        <input
          type="text"
          value={documentTitle}
          onChange={(e) => onTitleChange(e.target.value)}
          className="bg-transparent text-sm text-muted-foreground hover:text-foreground focus:text-foreground outline-none border-none px-2 py-1 rounded hover:bg-muted focus:bg-muted transition-colors min-w-0 max-w-[200px]"
          placeholder="Untitled Document"
          data-testid="input-document-title"
        />
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onUpload}
          className="gap-2"
          data-testid="button-upload-files"
        >
          <Upload className="h-4 w-4" />
          <span className="hidden sm:inline">Upload</span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              data-testid="button-format-selector"
            >
              <span>{formatLabels[format]}</span>
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => onFormatChange("html")}
              data-testid="menu-item-format-html"
            >
              HTML
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onFormatChange("latex")}
              data-testid="menu-item-format-latex"
            >
              LaTeX
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onFormatChange("rtf")}
              data-testid="menu-item-format-rtf"
            >
              RTF
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant="default"
          size="sm"
          onClick={onExport}
          className="gap-2"
          data-testid="button-export"
        >
          <Download className="h-4 w-4" />
          <span className="hidden sm:inline">Export</span>
        </Button>

        <div className="h-4 w-px bg-border" />
        
        <ThemeToggle />
      </div>
    </header>
  );
}
