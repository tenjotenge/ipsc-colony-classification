/**
 * Cluster Region Renderer
 * 
 * Render function for cluster regions with color coding by cluster ID.
 */

import type { RenderContext, LayerData } from "../RenderLayer";

export interface ClusterData {
  clusters: Array<{
    id: string;
    clusterId: number;
    bounds: { x: number; y: number; width: number; height: number };
  }>;
}

export function renderClusterRegions(
  ctx: CanvasRenderingContext2D,
  data: LayerData,
  context: RenderContext
): void {
  const clusterData = data as unknown as ClusterData;
  const { coordinateSystem, zoom } = context;

  for (const cluster of clusterData.clusters) {
    // Check if bounds are in viewport
    const viewportBounds = coordinateSystem.boundsToViewport(cluster.bounds);
    
    if (!isBoundsInViewport(viewportBounds, context.viewportBounds)) {
      continue;
    }

    // Color based on cluster ID
    const color = getClusterColor(cluster.clusterId);
    
    // Thin line for cluster regions
    ctx.strokeStyle = color;
    ctx.lineWidth = Math.max(0.5, 1 / zoom);
    
    ctx.strokeRect(
      viewportBounds.x,
      viewportBounds.y,
      viewportBounds.width,
      viewportBounds.height
    );
  }
}

function isBoundsInViewport(
  bounds: { x: number; y: number; width: number; height: number },
  viewport: { x: number; y: number; width: number; height: number }
): boolean {
  return (
    bounds.x < viewport.x + viewport.width &&
    bounds.x + bounds.width > viewport.x &&
    bounds.y < viewport.y + viewport.height &&
    bounds.y + bounds.height > viewport.y
  );
}

function getClusterColor(clusterId: number): string {
  // Scientific color palette - cluster colors
  const colors = [
    "#3b82f6", // blue
    "#10b981", // green
    "#f59e0b", // amber
    "#ef4444", // red
    "#8b5cf6", // purple
    "#ec4899", // pink
  ];
  return colors[clusterId % colors.length];
}
