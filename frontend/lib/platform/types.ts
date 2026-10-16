export interface FieldRecord {
  id: string;
  filename: string;
  sha256: string;
  width: number;
  height: number;
  created_at: string;
  latest_status?: "queued" | "running" | "succeeded" | "failed" | null;
}

export interface JobRecord {
  id: string;
  field_id: string;
  status: "queued" | "running" | "succeeded" | "failed";
  error: string | null;
  created_at: string;
  started_at: string | null;
  finished_at: string | null;
}

export interface ColonyRecord {
  colony_id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  tile_count: number;
  colony_score: number;
}

export interface AnalysisRecord {
  job_id: string;
  field_id: string;
  model_sha256: string;
  created_at: string;
  report: { image_id: string; ranked_colonies: ColonyRecord[] };
}

export interface DecisionRecord {
  id: string;
  job_id: string;
  colony_id: string;
  decision: "shortlist" | "flag" | "reject";
  reviewer: string;
  note: string;
  created_at: string;
}

export async function platformJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api/platform/${path}`, { ...init, cache: "no-store" });
  const value = await response.json();
  if (!response.ok) throw new Error(value.error || `Request failed (${response.status})`);
  return value as T;
}
