/**
 * Returns the correct API base URL depending on the execution context:
 * - Server-side (Next.js SSR/SSG inside Docker): uses BACKEND_URL → http://backend:8000
 * - Client-side (browser): uses NEXT_PUBLIC_API_URL → http://localhost:8000
 */
function getApiBase(): string {
  if (typeof window === "undefined") {
    // Server-side: use internal Docker hostname or fallback
    return process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  }
  // Client-side browser
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
}

const API_BASE = getApiBase();

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    // FastAPI can return detail as string OR array of validation errors
    const detail = err.detail;
    let message: string;
    if (typeof detail === "string") {
      message = detail;
    } else if (Array.isArray(detail)) {
      // 422 validation: [{loc, msg, type}, ...]
      message = detail.map((e: { loc?: string[]; msg?: string }) =>
        e.loc ? `${e.loc.join(".")}: ${e.msg}` : e.msg ?? "Validation error"
      ).join(", ");
    } else {
      message = "Request failed";
    }
    throw new Error(message);
  }
  return res.json();
}

// --- Types ---
export interface Project {
  id: string;
  name: string;
  description?: string;
  thumbnail_path?: string;
  asset_count?: number;
  completed_count?: number;
  created_at: string;
  updated_at: string;
}

export interface Asset {
  id: string;
  project_id?: string;
  type: "image" | "video";
  prompt: string;
  enhanced_prompt?: string;
  model: string;
  provider: string;
  aspect_ratio: string;
  duration?: number;
  resolution?: string;
  local_path?: string;
  thumbnail_path?: string;
  file_size_bytes?: number;
  status: "pending" | "generating" | "completed" | "failed";
  metadata_json: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface AssetList {
  items: Asset[];
  total: number;
  page: number;
  page_size: number;
}

export interface GenerateRequest {
  project_id?: string;
  type: "image" | "video";
  prompt: string;
  model: string;
  aspect_ratio: string;
  duration?: number;
  // Video audio (MMAudio v2)
  add_audio?: boolean;
  audio_prompt?: string;
}

export interface GenerationStatus {
  generation_id: string;
  asset_id: string;
  status: string;
  asset_status: string;
  error_message?: string;
  local_path?: string;
  thumbnail_path?: string;
}

export interface DashboardStats {
  total_assets: number;
  completed: number;
  generating: number;
  failed: number;
  images: number;
  videos: number;
}

// --- API functions ---
export const api = {
  // Projects
  projects: {
    list: () => request<Project[]>("/api/v1/projects"),
    get: (id: string) => request<Project>(`/api/v1/projects/${id}`),
    create: (data: { name: string; description?: string }) =>
      request<Project>("/api/v1/projects", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: { name?: string; description?: string }) =>
      request<Project>(`/api/v1/projects/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id: string) =>
      fetch(`${API_BASE}/api/v1/projects/${id}`, { method: "DELETE" }),
  },

  // Assets
  assets: {
    list: (params?: { project_id?: string; type?: string; status?: string; page?: number }) => {
      const qs = new URLSearchParams();
      if (params?.project_id) qs.set("project_id", params.project_id);
      if (params?.type) qs.set("type", params.type);
      if (params?.status) qs.set("status", params.status);
      if (params?.page) qs.set("page", String(params.page));
      return request<AssetList>(`/api/v1/assets?${qs}`);
    },
    get: (id: string) => request<Asset>(`/api/v1/assets/${id}`),
    delete: (id: string) =>
      fetch(`${API_BASE}/api/v1/assets/${id}`, { method: "DELETE" }),
    downloadUrl: (id: string) => `${API_BASE}/api/v1/assets/${id}/download`,
    thumbnailUrl: (path: string) => `${API_BASE}/storage/${path.replace(/^\/app\/storage\//, "")}`,
    stats: () => request<DashboardStats>("/api/v1/assets/stats"),
  },

  // Generation
  generation: {
    trigger: (data: GenerateRequest) =>
      request<{ asset_id: string; generation_id: string; status: string }>(
        "/api/v1/generate",
        { method: "POST", body: JSON.stringify(data) }
      ),
    status: (generationId: string) =>
      request<GenerationStatus>(`/api/v1/generations/${generationId}/status`),
  },
};
