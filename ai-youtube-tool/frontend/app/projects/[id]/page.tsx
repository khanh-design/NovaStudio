import { api } from "@/lib/api";
import { notFound } from "next/navigation";
import { AssetGallery } from "@/components/asset-gallery";
import { GenerationForm } from "@/components/generation-form";
import { ArrowLeft, FolderOpen, Clock, Sparkles } from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ProjectDetailPage({ params }: Props) {
  const { id } = await params;

  let project;
  try {
    project = await api.projects.get(id);
  } catch {
    notFound();
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Back + Header */}
      <div>
        <Link
          href="/projects"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Projects
        </Link>

        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <FolderOpen className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{project.name}</h1>
            {project.description && (
              <p className="text-muted-foreground text-sm mt-0.5">{project.description}</p>
            )}
            <p className="text-[10px] text-muted-foreground/50 mt-1 flex items-center gap-1">
              <Clock className="h-2.5 w-2.5" />
              Created {formatDate(project.created_at)}
            </p>
          </div>
        </div>
      </div>

      {/* Generate + Gallery */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="rounded-xl border border-border bg-card/50 p-5 sticky top-6">
            <div className="flex items-center gap-2 mb-5">
              <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
              </div>
              <h2 className="font-semibold text-sm">Generate for project</h2>
            </div>
            <GenerationForm projectId={id} />
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-sm font-semibold">Project Assets</h2>
            <div className="h-px flex-1 bg-border" />
          </div>
          <AssetGallery projectId={id} autoRefresh />
        </div>
      </div>
    </div>
  );
}
