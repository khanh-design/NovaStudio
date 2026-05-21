import { api } from "@/lib/api";
import { AssetGallery } from "@/components/asset-gallery";
import { GenerationForm } from "@/components/generation-form";
import { StatCard } from "@/components/stat-card";
import { Sparkles, TrendingUp } from "lucide-react";

async function getStats() {
  try {
    return await api.assets.stats();
  } catch {
    return { total_assets: 0, completed: 0, generating: 0, failed: 0, images: 0, videos: 0 };
  }
}

export default async function DashboardPage() {
  const stats = await getStats();

  const statCards = [
    { label: "Total Assets", value: stats.total_assets, icon: "LayoutDashboard", color: "text-primary" },
    { label: "Completed", value: stats.completed, icon: "CheckCircle", color: "text-emerald-400" },
    { label: "Generating", value: stats.generating, icon: "Loader2", color: "text-amber-400" },
    { label: "Images", value: stats.images, icon: "ImageIcon", color: "text-cyan-400" },
    { label: "Videos", value: stats.videos, icon: "Film", color: "text-rose-400" },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card/40 p-8">
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
        {/* Dot pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: "radial-gradient(circle, currentColor 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }} />

        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <span className="text-xs font-medium text-primary tracking-wider uppercase">
              Overview
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome to{" "}
            <span className="text-gradient">NovaStudio</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-2 max-w-xl">
            Your AI-powered content creation studio. Generate images, videos, and audio for your YouTube channel.
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {statCards.map(({ label, value, icon, color }, i) => (
          <StatCard
            key={label}
            label={label}
            value={value}
            icon={icon}
            color={color}
            delay={i * 80}
          />
        ))}
      </div>

      {/* Quick Generate + Recent Assets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Generate */}
        <div className="lg:col-span-1">
          <div className="rounded-xl border border-border bg-card/60 p-5 sticky top-6">
            <div className="flex items-center gap-2 mb-5">
              <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
              </div>
              <h2 className="font-semibold text-sm">Quick Generate</h2>
            </div>
            <GenerationForm />
          </div>
        </div>

        {/* Recent Assets */}
        <div className="lg:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="font-semibold text-sm">Recent Assets</h2>
            <div className="h-px flex-1 bg-border" />
          </div>
          <AssetGallery autoRefresh />
        </div>
      </div>
    </div>
  );
}
