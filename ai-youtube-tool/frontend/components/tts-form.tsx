"use client";
import { useState } from "react";
import { Mic, Loader2, Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";

// ------------------------------------------------------------------
// Voice catalog — mirrors backend tts_provider.py
// ------------------------------------------------------------------
const VIETNAMESE_VOICES = [
  // Miền Bắc
  { id: "banmai",    label: "Ban Mai",    region: "Bắc", gender: "Nữ" },
  { id: "leminh",   label: "Lê Minh",    region: "Bắc", gender: "Nam" },
  { id: "thuminh",  label: "Thu Minh",   region: "Bắc", gender: "Nữ" },
  { id: "giahuy",   label: "Gia Huy",    region: "Bắc", gender: "Nam" },
  // Miền Nam
  { id: "lannhi",    label: "Lan Nhi",    region: "Nam", gender: "Nữ" },
  { id: "minhquang", label: "Minh Quang", region: "Nam", gender: "Nam" },
  { id: "ngoclam",   label: "Ngọc Lam",   region: "Nam", gender: "Nữ" },
  { id: "myan",      label: "Mỹ An",      region: "Nam", gender: "Nữ" },
  // Miền Trung
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
  "Bắc":   "bg-blue-500/15 border-blue-500/30 text-blue-400",
  "Nam":   "bg-green-500/15 border-green-500/30 text-green-400",
  "Trung": "bg-amber-500/15 border-amber-500/30 text-amber-400",
};

const MAX_CHARS = 4096;

// Group Vietnamese voices by region
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
  const [voice, setVoice] = useState("banmai");        // default: giọng Bắc
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

      setMessage({ type: "success", text: "✓ Đã xếp hàng! Đang tạo giọng nói..." });
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
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">Nội dung</label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, MAX_CHARS))}
          placeholder="Nhập text cần chuyển sang giọng nói..."
          rows={5}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary transition-shadow"
        />
        <p className={cn(
          "text-xs text-right",
          text.length > MAX_CHARS * 0.9 ? "text-yellow-400" : "text-muted-foreground"
        )}>
          {text.length}/{MAX_CHARS}
        </p>
      </div>

      {/* Vietnamese voices — FPT AI */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-muted-foreground">🇻🇳 Giọng Tiếng Việt</label>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">FPT AI</span>
        </div>
        {VI_GROUPS.map(({ region, voices }) => (
          <div key={region} className="space-y-1">
            <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">
              Miền {region}
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {voices.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setVoice(v.id)}
                  className={cn(
                    "flex items-center justify-between px-2.5 py-2 rounded-md border text-xs transition-all",
                    voice === v.id
                      ? REGION_COLORS[region]
                      : "border-border bg-background hover:border-primary/40 text-muted-foreground hover:text-foreground"
                  )}
                >
                  <span className="font-medium">{v.label}</span>
                  <span className="text-[10px] opacity-60">{v.gender}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Divider */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-px bg-border" />
        <span className="text-[10px] text-muted-foreground">hoặc</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      {/* OpenAI voices */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-muted-foreground">🌐 Giọng Đa Ngôn Ngữ</label>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border">OpenAI</span>
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {OPENAI_VOICES.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => setVoice(v.id)}
              className={cn(
                "px-2 py-1.5 rounded-md border text-xs transition-all text-center",
                voice === v.id
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-background hover:border-primary/40 text-muted-foreground hover:text-foreground"
              )}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {/* Model — only for OpenAI */}
      {!isFptVoice && (
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Chất lượng</label>
          <div className="flex gap-2">
            {MODELS.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setModel(m.id)}
                className={cn(
                  "flex-1 px-3 py-2 rounded-md border text-xs font-medium transition-all",
                  model === m.id
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-background hover:border-primary/40 text-foreground"
                )}
              >
                {m.label}
                <span className="block text-[10px] text-muted-foreground font-normal">{m.desc}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Current voice info */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground px-3 py-2 rounded-md bg-muted/50 border border-border">
        <Volume2 className="h-3.5 w-3.5 flex-shrink-0" />
        {isFptVoice
          ? (() => {
              const vi = VIETNAMESE_VOICES.find((v) => v.id === voice)!;
              return <span>Giọng <strong className="text-foreground">{vi.label}</strong> · Miền {vi.region} · {vi.gender} · FPT AI</span>;
            })()
          : <span>Voice <strong className="text-foreground">{voice}</strong> · OpenAI TTS</span>
        }
      </div>

      {/* Message */}
      {message && (
        <p className={cn(
          "text-xs px-3 py-2 rounded-md border",
          message.type === "success"
            ? "text-green-400 bg-green-500/10 border-green-500/20"
            : "text-red-400 bg-red-500/10 border-red-500/20"
        )}>
          {message.text}
        </p>
      )}

      <button
        type="submit"
        disabled={loading || !text.trim()}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mic className="h-4 w-4" />}
        {loading ? "Đang tạo..." : "Tạo giọng nói"}
      </button>
    </form>
  );
}
