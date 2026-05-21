export type ArtifactType =
  | "image"
  | "overlay"
  | "report"
  | "embedding"
  | "validation"
  | "retrieval";

export interface Artifact {
  id: string;
  type: ArtifactType;
  url: string;
  metadata: Record<string, any>;
  createdAt: Date;
  size?: number;
  checksum?: string;
}

export interface ArtifactRef {
  artifactId: string;
  version?: string;
}

export class ArtifactRegistry {
  private artifacts: Map<string, Artifact> = new Map();

  register(artifact: Artifact): void {
    this.artifacts.set(artifact.id, artifact);
  }

  get(id: string): Artifact | undefined {
    return this.artifacts.get(id);
  }

  getByType(type: ArtifactType): Artifact[] {
    return Array.from(this.artifacts.values()).filter((a) => a.type === type);
  }

  getByAnalysis(analysisId: string): Artifact[] {
    return Array.from(this.artifacts.values()).filter(
      (a) => a.metadata.analysisId === analysisId
    );
  }

  getByRun(runId: string): Artifact[] {
    return Array.from(this.artifacts.values()).filter(
      (a) => a.metadata.runId === runId
    );
  }

  unregister(id: string): void {
    this.artifacts.delete(id);
  }

  clear(): void {
    this.artifacts.clear();
  }
}

export const artifactRegistry = new ArtifactRegistry();
