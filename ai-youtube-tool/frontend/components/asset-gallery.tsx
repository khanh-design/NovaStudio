"use client";
import { useState, useEffect, useCallback } from "react";
import { api, AssetList } from "@/lib/api";
import { AssetCard } from "./asset-card";
import { Filter, RefreshCw, WifiOff } from "lucide-react";

interface AssetGalleryProps {
  projectId?: string;
  autoRefresh?: boolean;
}

const TYPE_FILTERS = ["all", "image", "video"];
const STATUS_FILTERS = ["all", "completed", "generating", "pending", "failed"];

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

  // Auto-refresh every 5s if there are generating assets
  useEffect(() => {
    if (!autoRefresh) return;
    const hasGenerating = data?.items.some(
      (a) => a.status === "generating" || a.status === "pending"
    );
    if (!hasGenerating) return;
    const interval = setInterval(() => fetchAssets(), 5000);
    return () => clearInterval(interval);
  }, [autoRefresh, data, fetchAssets]);

  const handleDelete = (id: string) => {
    setData((prev) =>
      prev ? { ...prev, items: prev.items.filter((a) => a.id !== id), total: prev.total - 1 } : prev
    );
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <Filter className="h-4 w-4 text-muted-foreground shrink-0" />

        <div className="flex gap-1 p-1 bg-muted rounded-md">
          {TYPE_FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setTypeFilter(f)}
              className={`px-3 py-1 rounded text-xs font-medium capitalize transition-colors ${
                typeFilter === f ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="flex gap-1 p-1 bg-muted rounded-md">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`px-3 py-1 rounded text-xs font-medium capitalize transition-colors ${
                statusFilter === f ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <button
          onClick={() => fetchAssets(true)}
          disabled={refreshing}
          className="ml-auto flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md border border-border text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </button>

        {data && !error && (
          <span className="text-xs text-muted-foreground">{data.total} assets</span>
        )}
      </div>

      {/* Error state */}
      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-6 text-center space-y-3">
          <WifiOff className="h-8 w-8 text-destructive/60 mx-auto" />
          <div>
            <p className="text-sm font-medium text-destructive">Connection Error</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">{error}</p>
          </div>
          <button
            onClick={() => fetchAssets(true)}
            className="text-xs px-3 py-1.5 rounded-md border border-destructive/30 text-destructive hover:bg-destructive/10 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Grid */}
      {!error && (
        <>
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="aspect-video rounded-lg bg-muted animate-pulse" />
              ))}
            </div>
          ) : data?.items.length === 0 ? (
            <div className="py-20 text-center text-muted-foreground">
              <p className="text-lg font-medium mb-1">No assets yet</p>
              <p className="text-sm">Generate something to see it here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {data?.items.map((asset) => (
                <AssetCard key={asset.id} asset={asset} onDelete={handleDelete} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
