import { cn } from "@/lib/utils";

const statusMap: Record<string, { label: string; class: string }> = {
  pending:    { label: "Pending",    class: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30" },
  generating: { label: "Generating", class: "bg-blue-500/15 text-blue-400 border-blue-500/30 animate-pulse" },
  completed:  { label: "Completed",  class: "bg-green-500/15 text-green-400 border-green-500/30" },
  failed:     { label: "Failed",     class: "bg-red-500/15 text-red-400 border-red-500/30" },
  queued:     { label: "Queued",     class: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30" },
  processing: { label: "Processing", class: "bg-blue-500/15 text-blue-400 border-blue-500/30 animate-pulse" },
};

export function StatusBadge({ status }: { status: string }) {
  const config = statusMap[status] ?? { label: status, class: "bg-muted text-muted-foreground border-border" };
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border", config.class)}>
      {status === "generating" || status === "processing" ? (
        <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current animate-ping" />
      ) : null}
      {config.label}
    </span>
  );
}
