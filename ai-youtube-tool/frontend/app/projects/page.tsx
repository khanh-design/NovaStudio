import { api } from "@/lib/api";
import Link from "next/link";
import { FolderOpen, Plus, ImageIcon, CheckCircle } from "lucide-react";
import { formatDate } from "@/lib/utils";

async function getProjects() {
  try { return await api.projects.list(); }
  catch { return []; }
}

export default async function ProjectsPage() {
  const projects = await getProjects();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground text-sm mt-1">Organize your content by project</p>
        </div>
        <Link
          href="/projects/new"
          className="flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" /> New Project
        </Link>
      </div>

      {projects.length === 0 ? (
        <div className="py-20 text-center">
          <FolderOpen className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-lg font-medium text-muted-foreground">No projects yet</p>
          <p className="text-sm text-muted-foreground mt-1">Create a project to organize your assets</p>
          <Link
            href="/projects/new"
            className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" /> Create your first project
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              className="rounded-lg border border-border bg-card p-5 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all group space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">
                    {project.name}
                  </h3>
                  {project.description && (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{project.description}</p>
                  )}
                </div>
                <FolderOpen className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              </div>

              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <ImageIcon className="h-3 w-3" />
                  {project.asset_count ?? 0} assets
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3 text-green-400" />
                  {project.completed_count ?? 0} done
                </span>
              </div>

              <p className="text-xs text-muted-foreground/60">{formatDate(project.created_at)}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
