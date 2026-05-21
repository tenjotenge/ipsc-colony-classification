// Normalized frontend domain models
// These protect the frontend from backend schema evolution

export interface NormalizedRun {
  id: string;
  name: string;
  status: "pending" | "running" | "completed" | "failed";
  createdAt: Date;
  completedAt?: Date;
  plateCount: number;
  analysisCount: number;
  metrics: NormalizedRunMetrics;
}

export interface NormalizedRunMetrics {
  avgCalibratedScore: number;
  avgPerturbationStability: number;
  avgEntropy: number;
  domainAgreement: number;
  retrievalConsistency: number;
}

export interface NormalizedAnalysis {
  id: string;
  runId: string;
  plateId: string;
  status: "pending" | "processing" | "completed" | "failed";
  createdAt: Date;
  completedAt?: Date;
  colonies: NormalizedColony[];
  heatmap: NormalizedHeatmap;
  validation: NormalizedValidation;
  retrieval: NormalizedRetrieval;
}

export interface NormalizedColony {
  id: string;
  position: { x: number; y: number };
  bounds: { x: number; y: number; width: number; height: number };
  calibratedScore: number;
  perturbationStability: number;
  entropy: number;
  domainAgreement: number;
  retrievalConsistency: number;
  consensusRank: number;
  clusterId?: string;
  uncertainty: NormalizedUncertainty;
}

export interface NormalizedUncertainty {
  total: number;
  calibration: number;
  domain: number;
  retrieval: number;
  spatial: number;
}

export interface NormalizedHeatmap {
  id: string;
  type: "confidence" | "entropy" | "uncertainty";
  url: string;
  metadata: {
    width: number;
    height: number;
    min: number;
    max: number;
  };
}

export interface NormalizedValidation {
  id: string;
  crossDomainResults: NormalizedCrossDomainResult[];
  calibrationMetrics: NormalizedCalibrationMetrics;
  consensusBreakdown: NormalizedConsensusBreakdown;
}

export interface NormalizedCrossDomainResult {
  heldOutDomain: string;
  performance: number;
  entropyIncrease: number;
  calibrationDrift: number;
}

export interface NormalizedCalibrationMetrics {
  expectedReliability: number;
  temperature: number;
  brierScore: number;
  ece: number;
}

export interface NormalizedConsensusBreakdown {
  calibratedScoreWeight: number;
  perturbationStabilityWeight: number;
  entropyWeight: number;
  retrievalConsistencyWeight: number;
  domainAgreementWeight: number;
}

export interface NormalizedRetrieval {
  id: string;
  neighbors: NormalizedNeighbor[];
  embeddingSpace: NormalizedEmbeddingSpace;
}

export interface NormalizedNeighbor {
  colonyId: string;
  similarity: number;
  position: { x: number; y: number };
  calibratedScore: number;
  domain: string;
}

export interface NormalizedEmbeddingSpace {
  dimensions: number;
  clusterCount: number;
  silhouetteScore: number;
  url?: string; // Visualization URL
}
