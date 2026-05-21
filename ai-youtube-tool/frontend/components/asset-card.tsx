"use client";
import { useState } from "react";
import Image from "next/image";
import { Download, Trash2, ImageIcon, Film, Clock, Maximize2, X, Volume2, VolumeX } from "lucide-react";
import { Asset, api } from "@/lib/api";
import { StatusBadge } from "./status-badge";
import { cn, formatBytes, formatDate, truncate } from "@/lib/utils";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function storagePathToUrl(storagePath: string): string {
  const normalized = storagePath.replace(/\\/g, "/");
  const idx = normalized.indexOf("/storage/");
  const relativePath = idx !== -1 ? normalized.slice(idx + "/storage/".length) : normalized;
  return `${API_BASE}/storage/${relativePath}`;
}

function getThumbnailUrl(asset: Asset): string | null {
  if (asset.thumbnail_path) return storagePathToUrl(asset.thumbnail_path);
  if (asset.local_path && asset.type === "image") return storagePathToUrl(asset.local_path);
  return null;
}

function getMediaUrl(asset: Asset): string | null {
  if (asset.local_path) return storagePathToUrl(asset.local_path);
  return null;
}

interface AssetCardProps {
  asset: Asset;
  onDelete?: (id: string) => void;
  style?: React.CSSProperties;
}

export function AssetCard({ asset, onDelete, style }: AssetCardProps) {
  const [deleting, setDeleting] = useState(false);
  const [lightbox, setLightbox] = useState(false);
  const [thumbError, setThumbError] = useState(false);
  const thumbnailUrl = getThumbnailUrl(asset);
  const mediaUrl = getMediaUrl(asset);

  const handleDelete = async () => {
    if (!confirm("Delete this asset?")) return;
    setDeleting(true);
    try {
      await api.assets.delete(asset.id);
      onDelete?.(asset.id);
    } catch {
      setDeleting(false);
    }
  };

  return (
    <>
      <div
        className={cn(
          "group relative rounded-xl border border-border bg-card/50 overflow-hidden transition-all duration-300",
          "hover:border-primary/25 hover:shadow-lg hover:shadow-black/20"
        )}
        style={style}
      >
        {/* Thumbnail */}
        <div className="relative aspect-video bg-muted/30 flex items-center justify-center overflow-hidden">
          {thumbnailUrl && !thumbError && asset.status === "completed" ? (
            <Image
              src={thumbnailUrl}
              alt={asset.prompt}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              unoptimized
              onError={() => setThumbError(true)}
            />
          ) : (
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              {asset.type === "video"
                ? <Film className="h-8 w-8 opacity-20" />
                : <ImageIcon className="h-8 w-8 opacity-20" />}
              {(asset.status === "pending" || asset.status === "generating") && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-10 w-10 rounded-full border-2 border-primary/60 border-t-transparent animate-spin" />
                </div>
              )}
            </div>
          )}

          {/* Hover overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-4 gap-2">
            {asset.status === "completed" && (
              <>
                <a
                  href={api.assets.downloadUrl(asset.id)}
                  download
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:brightness-110 transition-all"
                >
                  <Download className="h-3.5 w-3.5" /> Download
                </a>
                <button
                  onClick={() => setLightbox(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 backdrop-blur-sm text-white text-xs font-medium hover:bg-white/20 transition-all"
                >
                  <Maximize2 className="h-3.5 w-3.5" /> View
                </button>
              </>
            )}
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-destructive/80 text-destructive-foreground text-xs font-medium hover:bg-destructive transition-all"
            >
              <Trash2 className="h-3.5 w-3.5" /> {deleting ? "…" : "Delete"}
            </button>
          </div>

          {/* Type badge */}
          <div className="absolute top-2.5 left-2.5">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/50 backdrop-blur-sm text-white/90 text-[10px] font-medium">
              {asset.type === "video" ? <Film className="h-3 w-3" /> : <ImageIcon className="h-3 w-3" />}
              {asset.type}
              {/* Audio status for videos */}
              {asset.type === "video" && asset.status === "completed" && (
                asset.metadata_json?.has_audio
                  ? <Volume2 className="h-3 w-3 text-emerald-400" />
                  : <VolumeX className="h-3 w-3 text-red-400" />
              )}
            </span>
          </div>

          {/* Status badge */}
          <div className="absolute top-2.5 right-2.5">
            <StatusBadge status={asset.status} />
          </div>
        </div>

        {/* Info */}
        <div className="p-3 space-y-2">
          <p className="text-xs text-foreground/80 leading-relaxed line-clamp-2">
            {truncate(asset.prompt, 120)}
          </p>

          <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatDate(asset.created_at)}
            </span>
            {asset.file_size_bytes && (
              <span className="ml-auto font-mono">{formatBytes(asset.file_size_bytes)}</span>
            )}
          </div>

          <p className="text-[10px] text-muted-foreground/50 truncate font-mono">{asset.model}</p>
        </div>
      </div>

      {/* Lightbox Modal */}
      {lightbox && mediaUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-lg flex items-center justify-center p-4"
          onClick={() => setLightbox(false)}
        >
          <button
            onClick={() => setLightbox(false)}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>

          <div onClick={(e) => e.stopPropagation()} className="max-w-5xl max-h-[85vh] w-full">
            {asset.type === "video" ? (
              <video
                src={mediaUrl}
                controls
                autoPlay
                className="w-full max-h-[85vh] rounded-xl"
              />
            ) : (
              <Image
                src={mediaUrl}
                alt={asset.prompt}
                width={1920}
                height={1080}
                className="w-full h-auto rounded-xl object-contain max-h-[85vh]"
                unoptimized
              />
            )}
          </div>
        </div>
      )}
    </>
  );
}
