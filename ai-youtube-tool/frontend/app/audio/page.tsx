"use client";
import { useState, useCallback, useEffect } from "react";
import { Mic, RefreshCw, Music2 } from "lucide-react";
import { TTSForm } from "@/components/tts-form";
import { AudioCard } from "@/components/audio-card";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface AudioAsset {
  id: string;
  text: string;
  voice: string;
  model: string;
  status: string;
  file_size_bytes?: number;
  created_at: string;
  error_message?: string;
}

export default function AudioPage() {
  const [audios, setAudios] = useState<AudioAsset[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAudios = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch(`${API_BASE}/api/v1/tts`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setAudios(data.items || []);
      setTotal(data.total || 0);
    } catch {
      setError("Cannot connect to backend");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAudios();
    // Auto-refresh every 5s if any audio is pending/processing
    const interval = setInterval(() => {
      if (audios.some((a) => a.status === "pending" || a.status === "processing")) {
        fetchAudios();
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchAudios, audios]);

  const handleDelete = (id: string) => {
    setAudios((prev) => prev.filter((a) => a.id !== id));
    setTotal((t) => t - 1);
  };

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Mic className="h-6 w-6 text-primary" />
          Text to Speech
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Convert text to natural-sounding speech with OpenAI TTS
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left — Form */}
        <div className="lg:col-span-1">
          <div className="rounded-lg border border-border bg-card p-5">
            <h2 className="font-semibold mb-4 text-sm">Generate Speech</h2>
            <TTSForm onGenerated={fetchAudios} />
          </div>
        </div>

        {/* Right — Gallery */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-sm">
              Audio Library
              {total > 0 && (
                <span className="ml-2 text-xs text-muted-foreground font-normal">{total} files</span>
              )}
            </h2>
            <button
              onClick={fetchAudios}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="rounded-lg border border-border bg-card h-36 animate-pulse" />
              ))}
            </div>
          ) : error ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-center">
              <p className="text-sm text-destructive">{error}</p>
              <button onClick={fetchAudios} className="mt-2 text-xs text-muted-foreground hover:text-foreground">
                Try again
              </button>
            </div>
          ) : audios.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-12 flex flex-col items-center gap-3 text-muted-foreground">
              <Music2 className="h-10 w-10 opacity-20" />
              <p className="text-sm">No audio generated yet</p>
              <p className="text-xs">Write some text on the left and click Generate Speech</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {audios.map((audio) => (
                <AudioCard key={audio.id} audio={audio} onDelete={handleDelete} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
