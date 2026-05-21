import { NormalizedRetrieval, NormalizedNeighbor, NormalizedEmbeddingSpace } from "./types";

export function normalizeRetrieval(raw: any): NormalizedRetrieval {
  return {
    id: raw.id || raw.retrieval_id,
    neighbors: (raw.neighbors || []).map(normalizeNeighbor),
    embeddingSpace: normalizeEmbeddingSpace(raw.embedding_space || raw.embeddingSpace || {}),
  };
}

function normalizeNeighbor(raw: any): NormalizedNeighbor {
  return {
    colonyId: raw.colony_id || raw.colonyId || "",
    similarity: raw.similarity || 0,
    position: raw.position || { x: 0, y: 0 },
    calibratedScore: raw.calibrated_score || raw.calibratedScore || 0,
    domain: raw.domain || "",
  };
}

function normalizeEmbeddingSpace(raw: any): NormalizedEmbeddingSpace {
  return {
    dimensions: raw.dimensions || 0,
    clusterCount: raw.cluster_count || raw.clusterCount || 0,
    silhouetteScore: raw.silhouette_score || raw.silhouetteScore || 0,
    url: raw.url || raw.visualization_url || raw.visualizationUrl,
  };
}
