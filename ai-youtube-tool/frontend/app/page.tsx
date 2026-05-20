import { api } from "@/lib/api";
import { AssetGallery } from "@/components/asset-gallery";
import { GenerationForm } from "@/components/generation-form";
import { StatCard } from "@/components/stat-card";

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
    { label: "Total Assets", value: stats.total_assets, icon: "LayoutDashboard" as const, color: "text-blue-400" },
    { label: "Completed",    value: stats.completed,    icon: "CheckCircle" as const,     color: "text-green-400" },
    { label: "Generating",   value: stats.generating,   icon: "Loader2" as const,         color: "text-yellow-400" },
    { label: "Images",       value: stats.images,        icon: "ImageIcon" as const,       color: "text-indigo-400" },
    { label: "Videos",       value: stats.videos,        icon: "Film" as const,            color: "text-pink-400" },
  ];


  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Your AI content generation overview</p>
      </div>

      {/* Stats — animated cards with stagger */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
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


      {/* Quick generate + Recent assets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick generate */}
        <div className="lg:col-span-1">
          <div className="rounded-lg border border-border bg-card p-5">
            <h2 className="font-semibold mb-4 text-sm">Quick Generate</h2>
            <GenerationForm />
          </div>
        </div>

        {/* Recent assets */}
        <div className="lg:col-span-2">
          <h2 className="font-semibold mb-4 text-sm">Recent Assets</h2>
          <AssetGallery autoRefresh />
        </div>
      </div>
    </div>
  );
}
