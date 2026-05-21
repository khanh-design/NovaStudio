"use client";
import { cn } from "@/lib/utils";

const statusConfig: Record<string, { color: string; label: string; dot: string }> = {
  completed: { color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", label: "Done", dot: "bg-emerald-400" },
  generating: { color: "bg-amber-500/10 text-amber-400 border-amber-500/20", label: "Generating", dot: "bg-amber-400 animate-pulse" },
  pending: { color: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20", label: "Queued", dot: "bg-cyan-400" },
  failed: { color: "bg-red-500/10 text-red-400 border-red-500/20", label: "Failed", dot: "bg-red-400" },
};

export function StatusBadge({ status }: { status: string }) {
  const cfg = statusConfig[status] ?? statusConfig.pending;
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] font-medium", cfg.color)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", cfg.dot)} />
      {cfg.label}
    </span>
  );
}
