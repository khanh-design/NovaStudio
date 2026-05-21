"use client";
import { useState, useRef } from "react";
import { Play, Pause, Download, Trash2, Clock, Volume2 } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";

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

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export function AudioCard({ audio, onDelete }: { audio: AudioAsset; onDelete?: (id: string) => void }) {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const audioUrl = `${API_BASE}/api/v1/tts/${audio.id}/download`;

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setPlaying(!playing);
  };

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    const pct = (audioRef.current.currentTime / audioRef.current.duration) * 100;
    setProgress(pct);
  };

  const handleEnded = () => {
    setPlaying(false);
    setProgress(0);
  };

  const handleDelete = async () => {
    if (!confirm("Delete this audio?")) return;
    setDeleting(true);
    try {
      await fetch(`${API_BASE}/api/v1/tts/${audio.id}`, { method: "DELETE" });
      onDelete?.(audio.id);
    } catch {
      setDeleting(false);
    }
  };

  const isReady = audio.status === "completed";
  const isFailed = audio.status === "failed";

  return (
    <div className={cn(
      "rounded-xl border border-border bg-card/50 p-4 space-y-3 transition-all duration-300",
      "hover:border-primary/20 hover:shadow-md hover:shadow-black/10"
    )}>
      {/* Top Row: Play + Text */}
      <div className="flex gap-3">
        {/* Play button */}
        <button
          onClick={togglePlay}
          disabled={!isReady}
          className={cn(
            "h-10 w-10 shrink-0 rounded-xl flex items-center justify-center transition-all",
            isReady
              ? "bg-primary/10 text-primary hover:bg-primary/20"
              : "bg-secondary text-muted-foreground cursor-not-allowed"
          )}
        >
          {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
        </button>

        <div className="flex-1 min-w-0">
          <p className="text-xs text-foreground/80 line-clamp-2 leading-relaxed">{audio.text}</p>
        </div>
      </div>

      {/* Progress bar */}
      {isReady && (
        <div className="h-1 w-full rounded-full bg-secondary overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Error message */}
      {isFailed && audio.error_message && (
        <p className="text-[10px] text-destructive bg-destructive/5 rounded-lg px-2.5 py-1.5 border border-destructive/10">
          {audio.error_message}
        </p>
      )}

      {/* Status indicator for pending/generating */}
      {(audio.status === "pending" || audio.status === "generating") && (
        <div className="flex items-center gap-2 text-[10px] text-amber-400">
          <div className="h-3 w-3 rounded-full border border-amber-400/40 border-t-transparent animate-spin" />
          {audio.status === "pending" ? "Queued..." : "Generating..."}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center gap-2">
        {/* Voice badge */}
        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
          {audio.voice}
        </span>

        {/* Duration */}
        {audio.duration_seconds && (
          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
            <Clock className="h-2.5 w-2.5" />
            {audio.duration_seconds}s
          </span>
        )}

        <span className="text-[10px] text-muted-foreground flex items-center gap-1 ml-auto">
          {formatDate(audio.created_at)}
        </span>

        {/* Actions */}
        {isReady && (
          <a
            href={audioUrl}
            download
            className="p-1.5 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
          </a>
        )}
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Hidden audio element */}
      {isReady && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleEnded}
          preload="none"
        />
      )}
    </div>
  );
}
