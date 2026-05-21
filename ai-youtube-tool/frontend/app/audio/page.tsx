"use client";
import { useState, useEffect, useCallback } from "react";
import { Mic, RefreshCw, Volume2 } from "lucide-react";
import { TTSForm } from "@/components/tts-form";
import { AudioCard } from "@/components/audio-card";
import { cn } from "@/lib/utils";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface AudioAsset {
  id: string;
  text: string;
  voice: string;
  model: string;
  status: string;
  file_size_bytes: number | null;
  duration_seconds: number | null;
  created_at: string;
  error_message: string | null;
}

export default function AudioPage() {
  const [audios, setAudios] = useState<AudioAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAudios = useCallback(async (showSpinner = false) => {
    if (showSpinner) setRefreshing(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/tts`);
      if (res.ok) {
        const data = await res.json();
        setAudios(data.items || data);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAudios();
  }, [fetchAudios]);

  // Auto-refresh if any audio is generating
  useEffect(() => {
    const hasGenerating = audios.some(a => a.status === "generating" || a.status === "pending");
    if (!hasGenerating) return;
    const interval = setInterval(() => fetchAudios(), 4000);
    return () => clearInterval(interval);
  }, [audios, fetchAudios]);

  const handleDelete = (id: string) => {
    setAudios(prev => prev.filter(a => a.id !== id));
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Mic className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Audio TTS</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Text-to-Speech with Vietnamese (FPT AI) and multilingual (OpenAI) voices
        </p>
      </div>

      {/* Two Column */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="lg:col-span-1">
          <div className="rounded-xl border border-border bg-card/50 p-5 sticky top-6">
            <div className="flex items-center gap-2 mb-5">
              <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
                <Volume2 className="h-3.5 w-3.5 text-primary" />
              </div>
              <h2 className="font-semibold text-sm">Create Audio</h2>
            </div>
            <TTSForm onGenerated={() => fetchAudios()} />
          </div>
        </div>

        {/* Audio Library */}
        <div className="lg:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-sm font-semibold">Audio Library</h2>
            <div className="h-px flex-1 bg-border" />
            <button
              onClick={() => fetchAudios(true)}
              disabled={refreshing}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-border text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all"
            >
              <RefreshCw className={cn("h-3 w-3", refreshing && "animate-spin")} />
              Refresh
            </button>
            <span className="text-[10px] text-muted-foreground font-mono">
              {audios.length} files
            </span>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-28 rounded-xl shimmer" />
              ))}
            </div>
          ) : audios.length === 0 ? (
            <div className="py-16 text-center">
              <div className="h-16 w-16 rounded-2xl bg-secondary/60 flex items-center justify-center mx-auto mb-4">
                <Mic className="h-7 w-7 text-muted-foreground/40" />
              </div>
              <p className="text-sm font-medium text-muted-foreground mb-1">No audio files yet</p>
              <p className="text-xs text-muted-foreground/60">Use the form to generate your first audio.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
