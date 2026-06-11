// Thin client for the FastAPI registration backend.

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export interface RegistrationMetrics {
  dice_before: number;
  dice_after: number;
  improvement: number;
  improvement_pct: number;
  folding_fraction: number;
  mean_displacement: number;
}

export interface RegistrationImages {
  fixed: string;
  moving: string;
  registered: string;
  diff_before: string;
  diff_after: string;
  deformation_grid: string;
  jacobian: string;
}

export interface RegistrationResponse {
  engine: string;
  metrics: RegistrationMetrics;
  images: RegistrationImages;
}

export async function getHealth(): Promise<{ status: string; engine: string }> {
  const r = await fetch(`${API}/health`, { cache: "no-store" });
  if (!r.ok) throw new Error(`backend not reachable (${r.status})`);
  return r.json();
}

export async function registerUploaded(
  fixed: File,
  moving: File
): Promise<RegistrationResponse> {
  const fd = new FormData();
  fd.append("fixed", fixed);
  fd.append("moving", moving);
  fd.append("use_sample", "false");
  const r = await fetch(`${API}/register`, { method: "POST", body: fd });
  if (!r.ok) throw new Error((await safeDetail(r)) ?? `register failed (${r.status})`);
  return r.json();
}

export async function registerSample(): Promise<RegistrationResponse> {
  const fd = new FormData();
  fd.append("use_sample", "true");
  const r = await fetch(`${API}/register`, { method: "POST", body: fd });
  if (!r.ok) throw new Error((await safeDetail(r)) ?? `register failed (${r.status})`);
  return r.json();
}

async function safeDetail(r: Response): Promise<string | null> {
  try {
    const j = await r.json();
    return j?.detail ?? null;
  } catch {
    return null;
  }
}
