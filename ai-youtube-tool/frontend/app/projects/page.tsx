import { api } from "@/lib/api";
import Link from "next/link";
import { FolderOpen, Plus, ArrowRight, Clock, ImageIcon } from "lucide-react";
import { formatDate } from "@/lib/utils";

async function getProjects() {
  try {
    return await api.projects.list();
  } catch {
    return [];
  }
}

export default async function ProjectsPage() {
  const projects = await getProjects();

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FolderOpen className="h-5 w-5 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Organize your AI-generated assets by project
          </p>
        </div>
        <Link
          href="#create"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:brightness-110 hover:shadow-lg hover:shadow-primary/25 transition-all"
        >
          <Plus className="h-4 w-4" />
          New Project
        </Link>
      </div>

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <div className="py-20 text-center">
          <div className="h-16 w-16 rounded-2xl bg-secondary/60 flex items-center justify-center mx-auto mb-4">
            <FolderOpen className="h-7 w-7 text-muted-foreground/40" />
          </div>
          <p className="text-sm font-medium text-muted-foreground mb-1">No projects yet</p>
          <p className="text-xs text-muted-foreground/60 mb-4">Create your first project to organize assets.</p>
          <Link
            href="#create"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:brightness-110 transition-all"
          >
            <Plus className="h-4 w-4" />
            Create Project
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project: { id: string; name: string; description?: string; created_at: string; asset_count?: number }) => (
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              className="group rounded-xl border border-border bg-card/50 p-5 space-y-3 transition-all duration-300 hover:border-primary/25 hover:shadow-lg hover:shadow-black/20"
            >
              {/* Project icon */}
              <div className="flex items-start justify-between">
                <div className="h-10 w-10 rounded-xl bg-primary/8 flex items-center justify-center group-hover:bg-primary/15 transition-colors">
                  <FolderOpen className="h-5 w-5 text-primary" />
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </div>

              {/* Info */}
              <div>
                <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">
                  {project.name}
                </h3>
                {project.description && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {project.description}
                  </p>
                )}
              </div>

              {/* Meta */}
              <div className="flex items-center gap-3 text-[10px] text-muted-foreground pt-2 border-t border-border/50">
                <span className="flex items-center gap-1">
                  <Clock className="h-2.5 w-2.5" />
                  {formatDate(project.created_at)}
                </span>
                {typeof project.asset_count === "number" && (
                  <span className="flex items-center gap-1 ml-auto">
                    <ImageIcon className="h-2.5 w-2.5" />
                    {project.asset_count} assets
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
