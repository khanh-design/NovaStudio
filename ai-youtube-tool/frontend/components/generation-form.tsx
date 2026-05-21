"use client";
import { useState, useCallback } from "react";
import { api, GenerateRequest } from "@/lib/api";
import { Sparkles, Loader2, Volume2, ImageIcon, Film, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModelOption {
  value: string;
  label: string;
  desc: string;
  tier: "standard" | "pro";
  audio?: boolean;
}

const IMAGE_MODELS: ModelOption[] = [
  { value: "fal-ai/flux/schnell", label: "Flux Schnell", desc: "Fast", tier: "standard" },
  { value: "fal-ai/flux/dev", label: "Flux Dev", desc: "Quality", tier: "standard" },
  { value: "fal-ai/flux-pro", label: "Flux Pro", desc: "Best", tier: "pro" },
];

const VIDEO_MODELS: ModelOption[] = [
  { value: "fal-ai/kling-video/v2.6/pro/text-to-video", label: "Kling v2.6 Pro", desc: "Best quality", tier: "pro", audio: true },
  { value: "fal-ai/kling-video/v2.6/standard/text-to-video", label: "Kling v2.6", desc: "Standard", tier: "standard", audio: true },
  { value: "fal-ai/minimax/video-01-live", label: "Minimax Live", desc: "Fast", tier: "standard", audio: true },
  { value: "fal-ai/kling-video/v1.6/standard/text-to-video", label: "Kling v1.6", desc: "Legacy", tier: "standard", audio: false },
  { value: "fal-ai/kling-video/v1.6/pro/text-to-video", label: "Kling v1.6 Pro", desc: "Legacy Pro", tier: "pro", audio: false },
  { value: "fal-ai/kling-video/v1/standard/text-to-video", label: "Kling v1", desc: "Original", tier: "standard", audio: false },
];

const ASPECT_RATIOS = [
  { value: "16:9", label: "16:9", desc: "Landscape" },
  { value: "9:16", label: "9:16", desc: "Portrait" },
  { value: "1:1", label: "1:1", desc: "Square" },
  { value: "4:3", label: "4:3", desc: "Classic" },
  { value: "3:4", label: "3:4", desc: "Vertical" },
];

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
  const [addAudio] = useState(true);
  const [audioPrompt, setAudioPrompt] = useState("");
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
        ...(type === "video" && { duration, add_audio: addAudio, audio_prompt: audioPrompt || undefined }),
      };
      const res = await api.generation.trigger(req);
      setSuccess(`Queued! ID: ${res.generation_id.slice(0, 8)}...`);
      setPrompt("");
      onQueued?.(res.asset_id, res.generation_id);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to queue generation");
    } finally {
      setLoading(false);
    }
  }, [prompt, type, model, aspectRatio, duration, projectId, onQueued, addAudio, audioPrompt]);

  const promptLen = prompt.length;
  const promptPercent = Math.min((promptLen / 10000) * 100, 100);

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Type Toggle */}
      <div className="flex gap-1.5 p-1 bg-secondary/60 rounded-xl">
        {([
          { value: "image" as const, icon: ImageIcon, label: "Image" },
          { value: "video" as const, icon: Film, label: "Video" },
        ]).map(({ value, icon: Icon, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => handleTypeChange(value)}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
              type === value
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Prompt */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-muted-foreground tracking-wide uppercase">
            Prompt
          </label>
        </div>
        <div className="relative">
          <textarea
            id="prompt-input"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe what you want to generate..."
            rows={4}
            required
            className="w-full rounded-xl border border-border bg-background/60 px-4 py-3 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 resize-none transition-all"
          />
          {/* Character progress ring */}
          <div className="absolute bottom-3 right-3 flex items-center gap-2">
            {promptLen > 800 && (
              <span className="text-[10px] text-amber-400">
                AI uses first 800 chars
              </span>
            )}
            <div className="relative h-6 w-6">
              <svg className="h-6 w-6 -rotate-90" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" className="text-border" strokeWidth="2" />
                <circle
                  cx="12" cy="12" r="10" fill="none"
                  stroke={promptLen > 9000 ? "#f87171" : promptLen > 800 ? "#fbbf24" : "hsl(var(--primary))"}
                  strokeWidth="2"
                  strokeDasharray={`${2 * Math.PI * 10}`}
                  strokeDashoffset={`${2 * Math.PI * 10 * (1 - promptPercent / 100)}`}
                  strokeLinecap="round"
                  className="transition-all duration-300"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Model Selector — Visual Cards */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground tracking-wide uppercase">
          Model
        </label>
        <div className="grid grid-cols-1 gap-1.5">
          {models.map((m) => (
            <button
              key={m.value}
              type="button"
              onClick={() => setModel(m.value)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left text-sm transition-all",
                model === m.value
                  ? "border-primary/40 bg-primary/5 text-foreground"
                  : "border-border bg-background/30 text-muted-foreground hover:border-primary/20 hover:bg-white/[0.02]"
              )}
            >
              <div className={cn(
                "h-4 w-4 rounded-full border-2 flex items-center justify-center transition-all",
                model === m.value ? "border-primary bg-primary" : "border-muted-foreground/30"
              )}>
                {model === m.value && <Check className="h-2.5 w-2.5 text-primary-foreground" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium truncate">{m.label}</span>
                  {m.audio && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      🔊
                    </span>
                  )}
                  {m.tier === "pro" && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                      PRO
                    </span>
                  )}
                </div>
              </div>
              <span className="text-xs text-muted-foreground">{m.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Aspect Ratio + Duration */}
      <div className="flex gap-3">
        <div className="flex-1 space-y-2">
          <label className="text-xs font-medium text-muted-foreground tracking-wide uppercase">
            Ratio
          </label>
          <div className="flex gap-1">
            {ASPECT_RATIOS.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => setAspectRatio(r.value)}
                className={cn(
                  "flex-1 py-2 rounded-lg border text-xs font-medium transition-all",
                  aspectRatio === r.value
                    ? "border-primary/40 bg-primary/5 text-primary"
                    : "border-border text-muted-foreground hover:text-foreground hover:border-primary/20"
                )}
                title={r.desc}
              >
                {r.value}
              </button>
            ))}
          </div>
        </div>

        {type === "video" && (
          <div className="w-28 space-y-2">
            <label className="text-xs font-medium text-muted-foreground tracking-wide uppercase">
              Duration
            </label>
            <div className="flex gap-1">
              {[5, 10].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDuration(d)}
                  className={cn(
                    "flex-1 py-2 rounded-lg border text-xs font-medium transition-all",
                    duration === d
                      ? "border-primary/40 bg-primary/5 text-primary"
                      : "border-border text-muted-foreground hover:text-foreground hover:border-primary/20"
                  )}
                >
                  {d}s
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Audio Settings (video only) */}
      {type === "video" && (
        <div className="space-y-2 rounded-xl border border-border/60 p-3 bg-white/[0.01]">
          <div className="flex items-center gap-2">
            <Volume2 className="h-3.5 w-3.5 text-emerald-400" />
            <span className="text-xs font-medium">Audio</span>
            <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Auto
            </span>
          </div>
          <input
            type="text"
            value={audioPrompt}
            onChange={(e) => setAudioPrompt(e.target.value)}
            placeholder="Describe audio (optional)..."
            maxLength={500}
            className="w-full rounded-lg border border-border bg-background/60 px-3 py-2 text-xs placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/40 transition-all"
          />
        </div>
      )}

      {/* Feedback */}
      {error && (
        <div className="text-xs text-destructive bg-destructive/5 border border-destructive/20 rounded-lg px-3 py-2.5 animate-fade-in-up">
          {error}
        </div>
      )}
      {success && (
        <div className="text-xs text-emerald-400 bg-emerald-500/5 border border-emerald-500/20 rounded-lg px-3 py-2.5 animate-fade-in-up flex items-center gap-2">
          <Check className="h-3.5 w-3.5" />
          {success}
        </div>
      )}

      {/* Submit */}
      <button
        id="generate-btn"
        type="submit"
        disabled={loading || !prompt.trim()}
        className={cn(
          "w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200",
          "bg-gradient-to-r from-primary to-amber-500 text-primary-foreground",
          "hover:shadow-lg hover:shadow-primary/25 hover:brightness-110",
          "disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none disabled:hover:brightness-100",
          loading && "animate-pulse"
        )}
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
