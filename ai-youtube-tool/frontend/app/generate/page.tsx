import { GenerationForm } from "@/components/generation-form";
import { AssetGallery } from "@/components/asset-gallery";
import { Sparkles } from "lucide-react";

export default function GeneratePage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Sparkles className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Generate</h1>
          <p className="text-muted-foreground text-sm mt-1">Create AI images and videos</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="lg:col-span-1">
          <div className="rounded-lg border border-border bg-card p-5">
            <GenerationForm />
          </div>

          {/* Tips */}
          <div className="mt-4 rounded-lg border border-border bg-card/50 p-4 space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Tips</p>
            <ul className="text-xs text-muted-foreground space-y-1.5">
              <li>• Be specific about style, lighting, and mood</li>
              <li>• Add "cinematic", "4K", "detailed" for better quality</li>
              <li>• Flux Schnell is fastest; Flux Pro is highest quality</li>
              <li>• Kling Pro gives better video motion</li>
            </ul>
          </div>
        </div>

        {/* All assets with auto-refresh */}
        <div className="lg:col-span-2">
          <h2 className="font-semibold mb-4 text-sm">All Assets</h2>
          <AssetGallery autoRefresh />
        </div>
      </div>
    </div>
  );
}
