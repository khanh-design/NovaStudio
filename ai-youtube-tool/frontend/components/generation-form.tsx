"use client";
import { useState, useCallback } from "react";
import { api, GenerateRequest } from "@/lib/api";
import { Sparkles, Loader2 } from "lucide-react";

const IMAGE_MODELS = [
  { value: "fal-ai/flux/schnell", label: "Flux Schnell (Fast)" },
  { value: "fal-ai/flux/dev",     label: "Flux Dev (Quality)" },
  { value: "fal-ai/flux-pro",     label: "Flux Pro (Best)" },
];

const VIDEO_MODELS = [
  { value: "fal-ai/kling-video/v1/standard/text-to-video", label: "Kling Standard" },
  { value: "fal-ai/kling-video/v1/pro/text-to-video",      label: "Kling Pro" },
];

const ASPECT_RATIOS = ["16:9", "9:16", "1:1", "4:3", "3:4"];

interface GenerationFormProps {
  projectId?: string;
  onQueued?: (assetId: string, generationId: string) => void;
}

export function GenerationForm({ projectId, onQueued }: GenerationFormProps) {
  const [type, setType] = useState<"image" | "video">("image");
  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState(IMAGE_MODELS[0].value);
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [duration, setDuration] = useState(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const models = type === "image" ? IMAGE_MODELS : VIDEO_MODELS;

  const handleTypeChange = (newType: "image" | "video") => {
    setType(newType);
    setModel(newType === "image" ? IMAGE_MODELS[0].value : VIDEO_MODELS[0].value);
  };

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const req: GenerateRequest = {
        type,
        prompt: prompt.trim(),
        model,
        aspect_ratio: aspectRatio,
        ...(projectId && { project_id: projectId }),
        ...(type === "video" && { duration }),
      };
      const res = await api.generation.trigger(req);
      setSuccess(`Queued! Generation ID: ${res.generation_id}`);
      setPrompt("");
      onQueued?.(res.asset_id, res.generation_id);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to queue generation");
    } finally {
      setLoading(false);
    }
  }, [prompt, type, model, aspectRatio, duration, projectId, onQueued]);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Type toggle */}
      <div className="flex gap-2 p-1 bg-muted rounded-lg w-fit">
        {(["image", "video"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => handleTypeChange(t)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all capitalize ${
              type === t
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Prompt */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground">Prompt</label>
        <textarea
          id="prompt-input"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe what you want to generate..."
          rows={4}
          required
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
        />
        <p className="text-xs text-muted-foreground text-right">{prompt.length}/2000</p>
      </div>

      {/* Model */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground">Model</label>
        <select
          id="model-select"
          value={model}
          onChange={(e) => setModel(e.target.value)}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {models.map((m) => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>
      </div>

      {/* Aspect ratio + Duration */}
      <div className="flex gap-3">
        <div className="flex-1 space-y-1.5">
          <label className="text-sm font-medium text-foreground">Aspect Ratio</label>
          <select
            value={aspectRatio}
            onChange={(e) => setAspectRatio(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {ASPECT_RATIOS.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>

        {type === "video" && (
          <div className="flex-1 space-y-1.5">
            <label className="text-sm font-medium text-foreground">Duration (s)</label>
            <input
              type="number"
              min={1}
              max={60}
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        )}
      </div>

      {/* Feedback */}
      {error && (
        <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2">
          {error}
        </p>
      )}
      {success && (
        <p className="text-sm text-green-400 bg-green-500/10 border border-green-500/20 rounded-md px-3 py-2">
          ✓ {success}
        </p>
      )}

      {/* Submit */}
      <button
        id="generate-btn"
        type="submit"
        disabled={loading || !prompt.trim()}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-md bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? (
          <><Loader2 className="h-4 w-4 animate-spin" /> Queuing…</>
        ) : (
          <><Sparkles className="h-4 w-4" /> Generate {type}</>
        )}
      </button>
    </form>
  );
}
