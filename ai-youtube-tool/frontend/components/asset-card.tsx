"use client";
import { useState } from "react";
import Image from "next/image";
import { Download, Trash2, ImageIcon, Film, Clock } from "lucide-react";
import { Asset, api } from "@/lib/api";
import { StatusBadge } from "./status-badge";
import { cn, formatBytes, formatDate, truncate } from "@/lib/utils";

interface AssetCardProps {
  asset: Asset;
  onDelete?: (id: string) => void;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/**
 * Convert an absolute server-side storage path to a served URL.
 * Works with both Docker paths (/app/storage/...) and Windows paths (D:\...\storage\...)
 */
function storagePathToUrl(storagePath: string): string {
  // Normalize backslashes to forward slashes (Windows paths)
  const normalized = storagePath.replace(/\\/g, "/");
  // Find the 'storage/' segment and take everything after it
  const idx = normalized.indexOf("/storage/");
  const relativePath = idx !== -1 ? normalized.slice(idx + "/storage/".length) : normalized;
  return `${API_BASE}/storage/${relativePath}`;
}

function getThumbnailUrl(asset: Asset): string | null {
  if (asset.thumbnail_path) return storagePathToUrl(asset.thumbnail_path);
  // For images without thumbnail, serve the image directly as preview
  if (asset.local_path && asset.type === "image") return storagePathToUrl(asset.local_path);
  return null;
}


export function AssetCard({ asset, onDelete }: AssetCardProps) {
  const [deleting, setDeleting] = useState(false);
  const thumbnailUrl = getThumbnailUrl(asset);

  const handleDelete = async () => {
    if (!confirm("Delete this asset?")) return;
    setDeleting(true);
    await api.assets.delete(asset.id);
    onDelete?.(asset.id);
  };

  return (
    <div className={cn(
      "group relative rounded-lg border border-border bg-card overflow-hidden transition-all",
      "hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5"
    )}>
      {/* Thumbnail area */}
      <div className="relative aspect-video bg-muted flex items-center justify-center overflow-hidden">
        {thumbnailUrl && asset.status === "completed" ? (
          <Image src={thumbnailUrl} alt={asset.prompt} fill className="object-cover" unoptimized />
        ) : (
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            {asset.type === "video"
              ? <Film className="h-8 w-8 opacity-30" />
              : <ImageIcon className="h-8 w-8 opacity-30" />}
            {(asset.status === "pending" || asset.status === "generating") && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              </div>
            )}
          </div>
        )}

        {/* Overlay actions */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          {asset.status === "completed" && (
            <a
              href={api.assets.downloadUrl(asset.id)}
              download
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
            >
              <Download className="h-3.5 w-3.5" /> Download
            </a>
          )}
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-destructive/80 text-destructive-foreground text-xs font-medium hover:bg-destructive transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" /> {deleting ? "…" : "Delete"}
          </button>
        </div>

        {/* Type badge */}
        <div className="absolute top-2 left-2">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-black/60 text-white text-xs font-medium">
            {asset.type === "video" ? <Film className="h-3 w-3" /> : <ImageIcon className="h-3 w-3" />}
            {asset.type}
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="p-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 flex-1">
            {truncate(asset.prompt, 100)}
          </p>
          <StatusBadge status={asset.status} />
        </div>

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatDate(asset.created_at)}
          </span>
          {asset.file_size_bytes && (
            <span className="ml-auto">{formatBytes(asset.file_size_bytes)}</span>
          )}
        </div>

        <p className="text-xs text-muted-foreground/60 truncate">{asset.model}</p>
      </div>
    </div>
  );
}
