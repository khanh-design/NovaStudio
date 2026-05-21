"use client";
import { useState } from "react";
import { Mic, Loader2, Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";

const VIETNAMESE_VOICES = [
  { id: "banmai",    label: "Ban Mai",    region: "Bắc", gender: "Nữ" },
  { id: "leminh",   label: "Lê Minh",    region: "Bắc", gender: "Nam" },
  { id: "thuminh",  label: "Thu Minh",   region: "Bắc", gender: "Nữ" },
  { id: "giahuy",   label: "Gia Huy",    region: "Bắc", gender: "Nam" },
  { id: "lannhi",    label: "Lan Nhi",    region: "Nam", gender: "Nữ" },
  { id: "minhquang", label: "Minh Quang", region: "Nam", gender: "Nam" },
  { id: "ngoclam",   label: "Ngọc Lam",   region: "Nam", gender: "Nữ" },
  { id: "myan",      label: "Mỹ An",      region: "Nam", gender: "Nữ" },
  { id: "linhsan",  label: "Linh San",   region: "Trung", gender: "Nữ" },
  { id: "camtu",    label: "Cẩm Tú",     region: "Trung", gender: "Nữ" },
];

const OPENAI_VOICES = [
  { id: "nova",    label: "Nova",    desc: "Energetic & friendly" },
  { id: "alloy",   label: "Alloy",   desc: "Balanced & neutral" },
  { id: "echo",    label: "Echo",    desc: "Smooth & clear" },
  { id: "fable",   label: "Fable",   desc: "Warm & expressive" },
  { id: "onyx",    label: "Onyx",    desc: "Deep & authoritative" },
  { id: "shimmer", label: "Shimmer", desc: "Soft & gentle" },
];

const MODELS = [
  { id: "tts-1",    label: "Standard", desc: "Faster" },
  { id: "tts-1-hd", label: "HD",       desc: "Higher quality" },
];

const REGION_COLORS: Record<string, string> = {
  "Bắc":   "bg-blue-500/10 border-blue-500/25 text-blue-400",
  "Nam":   "bg-emerald-500/10 border-emerald-500/25 text-emerald-400",
  "Trung": "bg-amber-500/10 border-amber-500/25 text-amber-400",
};

const MAX_CHARS = 4096;

const VI_GROUPS = ["Bắc", "Nam", "Trung"].map((region) => ({
  region,
  voices: VIETNAMESE_VOICES.filter((v) => v.region === region),
}));

const FPT_VOICE_IDS = new Set(VIETNAMESE_VOICES.map((v) => v.id));

interface TTSFormProps {
  onGenerated?: () => void;
}

export function TTSForm({ onGenerated }: TTSFormProps) {
  const [text, setText] = useState("");
  const [voice, setVoice] = useState("banmai");
  const [model, setModel] = useState("tts-1");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const isFptVoice = FPT_VOICE_IDS.has(voice);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || loading) return;

    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/tts/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.trim(), voice, model }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Generation failed");
      }

      setMessage({ type: "success", text: "✓ Queued! Generating audio..." });
      setText("");
      onGenerated?.();
    } catch (err: unknown) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Text input */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground tracking-wide uppercase">
          Text Content
        </label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, MAX_CHARS))}
          placeholder="Enter text to convert to speech..."
          rows={5}
          className="w-full rounded-xl border border-border bg-background/60 px-4 py-3 text-sm placeholder:text-muted-foreground/60 resize-none focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-all"
        />
        <p className={cn(
          "text-[10px] text-right font-mono",
          text.length > MAX_CHARS * 0.9 ? "text-amber-400" : "text-muted-foreground/50"
        )}>
          {text.length}/{MAX_CHARS}
        </p>
      </div>

      {/* Vietnamese voices */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-muted-foreground tracking-wide uppercase">
            🇻🇳 Vietnamese Voices
          </label>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-500/8 text-blue-400 border border-blue-500/15">
            FPT AI
          </span>
        </div>
        {VI_GROUPS.map(({ region, voices }) => (
          <div key={region} className="space-y-1.5">
            <p className="text-[10px] text-muted-foreground/50 uppercase tracking-wider font-medium">
              Miền {region}
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {voices.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setVoice(v.id)}
                  className={cn(
                    "flex items-center justify-between px-3 py-2 rounded-lg border text-xs transition-all",
                    voice === v.id
                      ? REGION_COLORS[region]
                      : "border-border bg-background/30 hover:border-primary/20 text-muted-foreground hover:text-foreground"
                  )}
                >
                  <span className="font-medium">{v.label}</span>
                  <span className="text-[10px] opacity-50">{v.gender}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-border" />
        <span className="text-[10px] text-muted-foreground/40 uppercase tracking-wider">or</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      {/* OpenAI voices */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-muted-foreground tracking-wide uppercase">
            🌐 Multilingual Voices
          </label>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-secondary text-muted-foreground border border-border">
            OpenAI
          </span>
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {OPENAI_VOICES.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => setVoice(v.id)}
              className={cn(
                "px-2.5 py-2 rounded-lg border text-xs transition-all text-center",
                voice === v.id
                  ? "border-primary/40 bg-primary/5 text-primary"
                  : "border-border bg-background/30 hover:border-primary/20 text-muted-foreground hover:text-foreground"
              )}
            >
              <span className="font-medium">{v.label}</span>
              <span className="block text-[9px] opacity-50 mt-0.5">{v.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Model quality — only for OpenAI */}
      {!isFptVoice && (
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground tracking-wide uppercase">
            Quality
          </label>
          <div className="flex gap-2">
            {MODELS.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setModel(m.id)}
                className={cn(
                  "flex-1 px-3 py-2.5 rounded-lg border text-xs font-medium transition-all",
                  model === m.id
                    ? "border-primary/40 bg-primary/5 text-primary"
                    : "border-border bg-background/30 hover:border-primary/20 text-foreground"
                )}
              >
                {m.label}
                <span className="block text-[10px] text-muted-foreground font-normal mt-0.5">{m.desc}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Current voice info */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground px-3 py-2.5 rounded-lg bg-secondary/40 border border-border">
        <Volume2 className="h-3.5 w-3.5 flex-shrink-0 text-primary/60" />
        {isFptVoice
          ? (() => {
              const vi = VIETNAMESE_VOICES.find((v) => v.id === voice)!;
              return <span>Voice <strong className="text-foreground">{vi.label}</strong> · Miền {vi.region} · {vi.gender} · FPT AI</span>;
            })()
          : <span>Voice <strong className="text-foreground">{voice}</strong> · OpenAI TTS</span>
        }
      </div>

      {/* Message */}
      {message && (
        <p className={cn(
          "text-xs px-3 py-2.5 rounded-lg border animate-fade-in-up",
          message.type === "success"
            ? "text-emerald-400 bg-emerald-500/5 border-emerald-500/15"
            : "text-red-400 bg-red-500/5 border-red-500/15"
        )}>
          {message.text}
        </p>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={loading || !text.trim()}
        className={cn(
          "w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200",
          "bg-gradient-to-r from-primary to-amber-500 text-primary-foreground",
          "hover:shadow-lg hover:shadow-primary/25 hover:brightness-110",
          "disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none disabled:hover:brightness-100",
        )}
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mic className="h-4 w-4" />}
        {loading ? "Generating..." : "Generate Audio"}
      </button>
    </form>
  );
}
