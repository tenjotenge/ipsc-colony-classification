import { Artifact, ArtifactRegistry } from "./registry";

export interface ReportArtifactMetadata {
  analysisId: string;
  runId: string;
  reportType: "validation" | "calibration" | "consensus" | "pilot-readiness";
  format: "json" | "csv" | "pdf";
}

export function createReportArtifact(
  id: string,
  url: string,
  metadata: ReportArtifactMetadata
): Artifact {
  return {
    id,
    type: "report",
    url,
    metadata,
    createdAt: new Date(),
  };
}

export function registerReportArtifact(
  registry: ArtifactRegistry,
  id: string,
  url: string,
  metadata: ReportArtifactMetadata
): void {
  const artifact = createReportArtifact(id, url, metadata);
  registry.register(artifact);
}
