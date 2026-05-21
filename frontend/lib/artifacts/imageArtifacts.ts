import { Artifact, ArtifactRegistry } from "./registry";

export interface ImageArtifactMetadata {
  analysisId: string;
  runId: string;
  plateId: string;
  width: number;
  height: number;
  tileSize?: number;
  tileOverlap?: number;
  format: "png" | "jpg" | "tiff";
}

export function createImageArtifact(
  id: string,
  url: string,
  metadata: ImageArtifactMetadata
): Artifact {
  return {
    id,
    type: "image",
    url,
    metadata,
    createdAt: new Date(),
  };
}

export function registerImageArtifact(
  registry: ArtifactRegistry,
  id: string,
  url: string,
  metadata: ImageArtifactMetadata
): void {
  const artifact = createImageArtifact(id, url, metadata);
  registry.register(artifact);
}
