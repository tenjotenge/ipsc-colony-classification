import { NormalizedAnalysis, NormalizedColony, NormalizedHeatmap, NormalizedValidation, NormalizedRetrieval } from "./types";
import { normalizeValidation } from "./normalizeValidation";
import { normalizeRetrieval } from "./normalizeRetrieval";

export function normalizeAnalysis(raw: any): NormalizedAnalysis {
  return {
    id: raw.id || raw.analysis_id,
    runId: raw.run_id || raw.runId,
    plateId: raw.plate_id || raw.plateId,
    status: normalizeStatus(raw.status),
    createdAt: new Date(raw.created_at || raw.createdAt),
    completedAt: raw.completed_at || raw.completedAt ? new Date(raw.completed_at || raw.completedAt) : undefined,
    colonies: (raw.colonies || []).map(normalizeColony),
    heatmap: normalizeHeatmap(raw.heatmap || {}),
    validation: normalizeValidation(raw.validation || {}),
    retrieval: normalizeRetrieval(raw.retrieval || {}),
  };
}

function normalizeStatus(status: string): NormalizedAnalysis["status"] {
  const s = status?.toLowerCase();
  if (["pending", "queued"].includes(s)) return "pending";
  if (["running", "processing", "in_progress"].includes(s)) return "processing";
  if (["completed", "done", "finished", "success"].includes(s)) return "completed";
  if (["failed", "error"].includes(s)) return "failed";
  return "pending";
}

function normalizeColony(raw: any): NormalizedColony {
  return {
    id: raw.id || raw.colony_id,
    position: raw.position || { x: 0, y: 0 },
    bounds: raw.bounds || raw.bounding_box || { x: 0, y: 0, width: 0, height: 0 },
    calibratedScore: raw.calibrated_score || raw.calibratedScore || 0,
    perturbationStability: raw.perturbation_stability || raw.perturbationStability || 0,
    entropy: raw.entropy || 0,
    domainAgreement: raw.domain_agreement || raw.domainAgreement || 0,
    retrievalConsistency: raw.retrieval_consistency || raw.retrievalConsistency || 0,
    consensusRank: raw.consensus_rank || raw.consensusRank || 0,
    clusterId: raw.cluster_id || raw.clusterId,
    uncertainty: normalizeUncertainty(raw.uncertainty || {}),
  };
}

function normalizeUncertainty(raw: any): NormalizedColony["uncertainty"] {
  return {
    total: raw.total || 0,
    calibration: raw.calibration || 0,
    domain: raw.domain || 0,
    retrieval: raw.retrieval || 0,
    spatial: raw.spatial || 0,
  };
}

function normalizeHeatmap(raw: any): NormalizedHeatmap {
  return {
    id: raw.id || "",
    type: raw.type || "confidence",
    url: raw.url || "",
    metadata: {
      width: raw.metadata?.width || raw.width || 0,
      height: raw.metadata?.height || raw.height || 0,
      min: raw.metadata?.min || raw.min || 0,
      max: raw.metadata?.max || raw.max || 0,
    },
  };
}
