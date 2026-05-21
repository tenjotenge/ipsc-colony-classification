import { Artifact, ArtifactRegistry } from "./registry";

export interface EmbeddingArtifactMetadata {
  analysisId: string;
  runId: string;
  dimensions: number;
  sampleCount: number;
  format: "npy" | "json" | "parquet";
  visualizationUrl?: string;
}

export function createEmbeddingArtifact(
  id: string,
  url: string,
  metadata: EmbeddingArtifactMetadata
): Artifact {
  return {
    id,
    type: "embedding",
    url,
    metadata,
    createdAt: new Date(),
  };
}

export function registerEmbeddingArtifact(
  registry: ArtifactRegistry,
  id: string,
  url: string,
  metadata: EmbeddingArtifactMetadata
): void {
  const artifact = createEmbeddingArtifact(id, url, metadata);
  registry.register(artifact);
}
