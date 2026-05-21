"use client";
import { useState, useRef } from "react";
import { Play, Pause, Download, Trash2, Mic, Loader2, AlertCircle } from "lucide-react";
import { cn, formatBytes, formatDate, truncate } from "@/lib/utils";

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

interface AudioCardProps {
  audio: AudioAsset;
  onDelete?: (id: string) => void;
}

export function AudioCard({ audio, onDelete }: AudioCardProps) {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const streamUrl = `${API_BASE}/api/v1/tts/${audio.id}/download`;

  const togglePlay = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio(streamUrl);
      audioRef.current.ontimeupdate = () => {
        const a = audioRef.current!;
        setProgress(a.duration ? (a.currentTime / a.duration) * 100 : 0);
      };
      audioRef.current.onended = () => {
        setPlaying(false);
        setProgress(0);
      };
    }

    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      audioRef.current.play();
      setPlaying(true);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this audio?")) return;
    setDeleting(true);
    audioRef.current?.pause();
    await fetch(`${API_BASE}/api/v1/tts/${audio.id}`, { method: "DELETE" });
    onDelete?.(audio.id);
  };

  const VOICE_COLORS: Record<string, string> = {
    alloy: "text-blue-400", echo: "text-cyan-400", fable: "text-amber-400",
    onyx: "text-purple-400", nova: "text-pink-400", shimmer: "text-green-400",
  };

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden hover:border-primary/40 transition-all">
      {/* Voice color bar */}
      <div className={cn(
        "h-1 w-full",
        audio.voice === "nova" ? "bg-pink-500" :
        audio.voice === "alloy" ? "bg-blue-500" :
        audio.voice === "echo" ? "bg-cyan-500" :
        audio.voice === "fable" ? "bg-amber-500" :
        audio.voice === "onyx" ? "bg-purple-500" : "bg-green-500"
      )} />

      <div className="p-4 space-y-3">
        {/* Text preview */}
        <p className="text-sm leading-relaxed line-clamp-3 text-foreground/90">
          {truncate(audio.text, 150)}
        </p>

        {/* Status / Player */}
        {audio.status === "completed" ? (
          <div className="space-y-2">
            {/* Progress bar */}
            <div className="h-1 rounded-full bg-border overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-100"
                style={{ width: `${progress}%` }}
              />
            </div>
            {/* Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={togglePlay}
                className="flex items-center justify-center h-8 w-8 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex-shrink-0"
              >
                {playing
                  ? <Pause className="h-3.5 w-3.5" />
                  : <Play className="h-3.5 w-3.5 ml-0.5" />}
              </button>
              <a
                href={streamUrl}
                download
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-border text-xs hover:bg-muted transition-colors"
              >
                <Download className="h-3 w-3" /> Download
              </a>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="ml-auto flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-destructive/40 text-destructive/80 text-xs hover:bg-destructive/10 transition-colors"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          </div>
        ) : audio.status === "failed" ? (
          <div className="flex items-center gap-2 text-xs text-red-400">
            <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
            <span>{audio.error_message || "Generation failed"}</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            <span>{audio.status === "processing" ? "Generating..." : "Queued..."}</span>
          </div>
        )}

        {/* Meta */}
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground pt-1 border-t border-border">
          <Mic className={cn("h-3 w-3", VOICE_COLORS[audio.voice] || "text-muted-foreground")} />
          <span className="capitalize">{audio.voice}</span>
          <span>·</span>
          <span>{audio.model}</span>
          {audio.file_size_bytes && (
            <>
              <span>·</span>
              <span>{formatBytes(audio.file_size_bytes)}</span>
            </>
          )}
          <span className="ml-auto">{formatDate(audio.created_at)}</span>
        </div>
      </div>
    </div>
  );
}
