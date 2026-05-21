import { Artifact, ArtifactRegistry } from "./registry";

export interface OverlayArtifactMetadata {
  analysisId: string;
  runId: string;
  overlayType: "heatmap" | "bounding-box" | "uncertainty" | "cluster" | "retrieval";
  width: number;
  height: number;
  min?: number;
  max?: number;
  colormap?: string;
}

export function createOverlayArtifact(
  id: string,
  url: string,
  metadata: OverlayArtifactMetadata
): Artifact {
  return {
    id,
    type: "overlay",
    url,
    metadata,
    createdAt: new Date(),
  };
}

export function registerOverlayArtifact(
  registry: ArtifactRegistry,
  id: string,
  url: string,
  metadata: OverlayArtifactMetadata
): void {
  const artifact = createOverlayArtifact(id, url, metadata);
  registry.register(artifact);
}
