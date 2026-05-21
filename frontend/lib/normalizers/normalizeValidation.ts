import { NormalizedValidation, NormalizedCrossDomainResult, NormalizedCalibrationMetrics, NormalizedConsensusBreakdown } from "./types";

export function normalizeValidation(raw: any): NormalizedValidation {
  return {
    id: raw.id || raw.validation_id,
    crossDomainResults: (raw.cross_domain_results || raw.crossDomainResults || []).map(normalizeCrossDomainResult),
    calibrationMetrics: normalizeCalibrationMetrics(raw.calibration_metrics || raw.calibrationMetrics || {}),
    consensusBreakdown: normalizeConsensusBreakdown(raw.consensus_breakdown || raw.consensusBreakdown || {}),
  };
}

function normalizeCrossDomainResult(raw: any): NormalizedCrossDomainResult {
  return {
    heldOutDomain: raw.held_out_domain || raw.heldOutDomain || "",
    performance: raw.performance || 0,
    entropyIncrease: raw.entropy_increase || raw.entropyIncrease || 0,
    calibrationDrift: raw.calibration_drift || raw.calibrationDrift || 0,
  };
}

function normalizeCalibrationMetrics(raw: any): NormalizedCalibrationMetrics {
  return {
    expectedReliability: raw.expected_reliability || raw.expectedReliability || 0,
    temperature: raw.temperature || 1.0,
    brierScore: raw.brier_score || raw.brierScore || 0,
    ece: raw.ece || 0,
  };
}

function normalizeConsensusBreakdown(raw: any): NormalizedConsensusBreakdown {
  return {
    calibratedScoreWeight: raw.calibrated_score_weight || raw.calibratedScoreWeight || 0,
    perturbationStabilityWeight: raw.perturbation_stability_weight || raw.perturbationStabilityWeight || 0,
    entropyWeight: raw.entropy_weight || raw.entropyWeight || 0,
    retrievalConsistencyWeight: raw.retrieval_consistency_weight || raw.retrievalConsistencyWeight || 0,
    domainAgreementWeight: raw.domain_agreement_weight || raw.domainAgreementWeight || 0,
  };
}
