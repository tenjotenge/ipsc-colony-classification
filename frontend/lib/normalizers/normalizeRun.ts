import { NormalizedRun, NormalizedRunMetrics } from "./types";

export function normalizeRun(raw: any): NormalizedRun {
  return {
    id: raw.id || raw.run_id,
    name: raw.name || raw.run_name || `Run ${raw.id}`,
    status: normalizeStatus(raw.status),
    createdAt: new Date(raw.created_at || raw.createdAt),
    completedAt: raw.completed_at || raw.completedAt ? new Date(raw.completed_at || raw.completedAt) : undefined,
    plateCount: raw.plate_count || raw.plateCount || 0,
    analysisCount: raw.analysis_count || raw.analysisCount || 0,
    metrics: normalizeRunMetrics(raw.metrics || {}),
  };
}

function normalizeStatus(status: string): NormalizedRun["status"] {
  const s = status?.toLowerCase();
  if (["pending", "queued"].includes(s)) return "pending";
  if (["running", "processing", "in_progress"].includes(s)) return "running";
  if (["completed", "done", "finished", "success"].includes(s)) return "completed";
  if (["failed", "error"].includes(s)) return "failed";
  return "pending";
}

function normalizeRunMetrics(raw: any): NormalizedRunMetrics {
  return {
    avgCalibratedScore: raw.avg_calibrated_score || raw.avgCalibratedScore || 0,
    avgPerturbationStability: raw.avg_perturbation_stability || raw.avgPerturbationStability || 0,
    avgEntropy: raw.avg_entropy || raw.avgEntropy || 0,
    domainAgreement: raw.domain_agreement || raw.domainAgreement || 0,
    retrievalConsistency: raw.retrieval_consistency || raw.retrievalConsistency || 0,
  };
}
