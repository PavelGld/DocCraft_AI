import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Eye, EyeOff } from "lucide-react";

export interface AISettings {
  apiKey: string;
  baseUrl: string;
  model: string;
}

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: AISettings;
  onSave: (settings: AISettings) => void;
}

const MODELS = [
  { value: "gpt-4o", label: "GPT-4o (OpenAI)", provider: "openai" },
  { value: "gpt-4o-mini", label: "GPT-4o Mini (OpenAI)", provider: "openai" },
  { value: "gpt-4-turbo", label: "GPT-4 Turbo (OpenAI)", provider: "openai" },
  { value: "gpt-3.5-turbo", label: "GPT-3.5 Turbo (OpenAI)", provider: "openai" },
  { value: "gemini-1.5-pro", label: "Gemini 1.5 Pro (Google)", provider: "google" },
  { value: "gemini-1.5-flash", label: "Gemini 1.5 Flash (Google)", provider: "google" },
  { value: "gemini-2.0-flash", label: "Gemini 2.0 Flash (Google)", provider: "google" },
  { value: "qwen-max", label: "Qwen Max (Alibaba)", provider: "alibaba" },
  { value: "qwen-plus", label: "Qwen Plus (Alibaba)", provider: "alibaba" },
  { value: "qwen-turbo", label: "Qwen Turbo (Alibaba)", provider: "alibaba" },
  { value: "qwen3-235b-a22b", label: "Qwen 3 235B (Alibaba)", provider: "alibaba" },
];

const BASE_URLS: Record<string, string> = {
  openai: "https://api.openai.com/v1",
  google: "https://generativelanguage.googleapis.com/v1beta/openai",
  alibaba: "https://dashscope.aliyuncs.com/compatible-mode/v1",
};

export function SettingsDialog({
  open,
  onOpenChange,
  settings,
  onSave,
}: SettingsDialogProps) {
  const [apiKey, setApiKey] = useState(settings.apiKey);
  const [baseUrl, setBaseUrl] = useState(settings.baseUrl);
  const [model, setModel] = useState(settings.model);
  const [showApiKey, setShowApiKey] = useState(false);

  useEffect(() => {
    setApiKey(settings.apiKey);
    setBaseUrl(settings.baseUrl);
    setModel(settings.model);
  }, [settings, open]);

  const handleModelChange = (value: string) => {
    setModel(value);
    const selectedModel = MODELS.find(m => m.value === value);
    if (selectedModel && !baseUrl) {
      setBaseUrl(BASE_URLS[selectedModel.provider] || "");
    }
  };

  const handleSave = () => {
    onSave({ apiKey, baseUrl, model });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>AI Settings</DialogTitle>
          <DialogDescription>
            Configure your AI provider settings. Leave API key empty to use the default Replit AI integration.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="model">Model</Label>
            <Select value={model} onValueChange={handleModelChange}>
              <SelectTrigger id="model" data-testid="select-model">
                <SelectValue placeholder="Select a model" />
              </SelectTrigger>
              <SelectContent>
                {MODELS.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="apiKey">API Key</Label>
            <div className="relative">
              <Input
                id="apiKey"
                type={showApiKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-... (leave empty for default)"
                className="pr-10"
                data-testid="input-api-key"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                onClick={() => setShowApiKey(!showApiKey)}
              >
                {showApiKey ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="baseUrl">Base URL</Label>
            <Input
              id="baseUrl"
              type="text"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="https://api.openai.com/v1"
              data-testid="input-base-url"
            />
            <p className="text-xs text-muted-foreground">
              API endpoint. Leave empty to use default.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} data-testid="button-save-settings">
            Save Settings
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
