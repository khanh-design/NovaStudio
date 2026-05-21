import { AssetGallery } from "@/components/asset-gallery";
import { GenerationForm } from "@/components/generation-form";
import { Sparkles, Lightbulb } from "lucide-react";

export default function GeneratePage() {
  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Generate</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Create AI-powered images and videos with a single prompt
        </p>
      </div>

      {/* Two Column */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="lg:col-span-1 space-y-4">
          <div className="rounded-xl border border-border bg-card/50 p-5 sticky top-6">
            <GenerationForm />
          </div>

          {/* Tips */}
          <div className="rounded-xl border border-border bg-card/30 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-3.5 w-3.5 text-amber-400" />
              <h3 className="text-xs font-semibold text-foreground">Tips</h3>
            </div>
            <div className="space-y-2">
              {[
                "Be specific: describe lighting, mood, camera angle",
                "Include style keywords: cinematic, aerial, close-up",
                "Mention colors and atmosphere for best results",
                "For video: describe motion and action",
              ].map((tip, i) => (
                <div key={i} className="flex items-start gap-2 text-[11px] text-muted-foreground">
                  <span className="text-primary/60 mt-0.5">•</span>
                  {tip}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Gallery */}
        <div className="lg:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-sm font-semibold">All Assets</h2>
            <div className="h-px flex-1 bg-border" />
          </div>
          <AssetGallery autoRefresh />
        </div>
      </div>
    </div>
  );
}
