"use client";
import { useState, useEffect, useCallback } from "react";
import { api, AssetList } from "@/lib/api";
import { AssetCard } from "./asset-card";
import { Filter, RefreshCw, WifiOff, ImageIcon, Film, CheckCircle, Loader2, AlertTriangle, Wifi } from "lucide-react";
import { cn } from "@/lib/utils";
import { useGenerationStatus } from "@/hooks/useGenerationStatus";

interface AssetGalleryProps {
  projectId?: string;
  autoRefresh?: boolean;
}

const TYPE_FILTERS = [
  { key: "all", label: "All", icon: null },
  { key: "image", label: "Images", icon: ImageIcon },
  { key: "video", label: "Videos", icon: Film },
];

const STATUS_FILTERS = [
  { key: "all", label: "All" },
  { key: "completed", label: "Done", icon: CheckCircle },
  { key: "generating", label: "Active", icon: Loader2 },
  { key: "failed", label: "Failed", icon: AlertTriangle },
];

export function AssetGallery({ projectId, autoRefresh = false }: AssetGalleryProps) {
  const [data, setData] = useState<AssetList | null>(null);
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAssets = useCallback(async (showSpinner = false) => {
    if (showSpinner) setRefreshing(true);
    setError(null);
    try {
      const result = await api.assets.list({
        project_id: projectId,
        type: typeFilter !== "all" ? typeFilter : undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
      });
      setData(result);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      if (msg.toLowerCase().includes("failed to fetch") || msg.toLowerCase().includes("networkerror")) {
        setError("Cannot connect to backend. Make sure the API server is running at http://localhost:8000");
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [projectId, typeFilter, statusFilter]);

  useEffect(() => {
    setLoading(true);
    fetchAssets();
  }, [fetchAssets]);

  // WebSocket: instant refresh on status change
  const { connected: wsConnected } = useGenerationStatus(
    useCallback(() => {
      // Re-fetch when any generation status changes
      fetchAssets();
    }, [fetchAssets])
  );

  // Fallback: poll every 5s if there are generating assets (in case WS fails)
  useEffect(() => {
    if (!autoRefresh) return;
    const hasGenerating = data?.items.some(
      (a) => a.status === "generating" || a.status === "pending"
    );
    if (!hasGenerating) return;
    // If WS connected, use longer poll interval as backup
    const interval = setInterval(() => fetchAssets(), wsConnected ? 15000 : 5000);
    return () => clearInterval(interval);
  }, [autoRefresh, data, fetchAssets, wsConnected]);

  const handleDelete = (id: string) => {
    setData((prev) =>
      prev ? { ...prev, items: prev.items.filter((a) => a.id !== id), total: prev.total - 1 } : prev
    );
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <Filter className="h-3.5 w-3.5 text-muted-foreground shrink-0" />

        <div className="flex gap-0.5 p-0.5 bg-secondary/60 rounded-lg">
          {TYPE_FILTERS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTypeFilter(key)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200",
                typeFilter === key
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {Icon && <Icon className="h-3 w-3" />}
              {label}
            </button>
          ))}
        </div>

        <div className="flex gap-0.5 p-0.5 bg-secondary/60 rounded-lg">
          {STATUS_FILTERS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setStatusFilter(key)}
              className={cn(
                "px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200",
                statusFilter === key
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <button
          onClick={() => fetchAssets(true)}
          disabled={refreshing}
          className="ml-auto flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-border text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all"
        >
          <RefreshCw className={cn("h-3 w-3", refreshing && "animate-spin")} />
          Refresh
        </button>

        {data && !error && (
          <span className="text-[10px] text-muted-foreground font-mono">
            {data.total} assets
          </span>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-6 text-center space-y-3">
          <WifiOff className="h-8 w-8 text-destructive/50 mx-auto" />
          <div>
            <p className="text-sm font-medium text-destructive">Connection Error</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">{error}</p>
          </div>
          <button
            onClick={() => fetchAssets(true)}
            className="text-xs px-4 py-2 rounded-lg border border-destructive/20 text-destructive hover:bg-destructive/5 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Grid */}
      {!error && (
        <>
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="aspect-video rounded-xl shimmer" />
              ))}
            </div>
          ) : data?.items.length === 0 ? (
            <div className="py-20 text-center">
              <div className="h-16 w-16 rounded-2xl bg-secondary/60 flex items-center justify-center mx-auto mb-4">
                <ImageIcon className="h-7 w-7 text-muted-foreground/40" />
              </div>
              <p className="text-sm font-medium text-muted-foreground mb-1">No assets yet</p>
              <p className="text-xs text-muted-foreground/60">Generate something to see it here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {data?.items.map((asset, i) => (
                <AssetCard
                  key={asset.id}
                  asset={asset}
                  onDelete={handleDelete}
                  style={{ animationDelay: `${i * 50}ms` }}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
