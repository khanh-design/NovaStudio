import { api } from "@/lib/api";
import { notFound } from "next/navigation";
import { AssetGallery } from "@/components/asset-gallery";
import { GenerationForm } from "@/components/generation-form";
import { ArrowLeft, FolderOpen } from "lucide-react";
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
    <div className="p-6 space-y-6">
      {/* Back + Header */}
      <div>
        <Link
          href="/projects"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Projects
        </Link>
        <div className="flex items-start gap-3">
          <FolderOpen className="h-6 w-6 text-primary mt-0.5 shrink-0" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{project.name}</h1>
            {project.description && (
              <p className="text-muted-foreground text-sm mt-0.5">{project.description}</p>
            )}
            <p className="text-xs text-muted-foreground/60 mt-1">Created {formatDate(project.created_at)}</p>
          </div>
        </div>
      </div>

      {/* Generate + Gallery */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="rounded-lg border border-border bg-card p-5 sticky top-6">
            <h2 className="font-semibold mb-4 text-sm">Generate for this project</h2>
            <GenerationForm projectId={id} />
          </div>
        </div>

        <div className="lg:col-span-2">
          <h2 className="font-semibold mb-4 text-sm">Project Assets</h2>
          <AssetGallery projectId={id} autoRefresh />
        </div>
      </div>
    </div>
  );
}
