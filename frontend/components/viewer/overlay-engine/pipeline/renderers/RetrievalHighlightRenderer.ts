/**
 * Retrieval Highlight Renderer
 * 
 * Render function for retrieval similarity highlights with dashed borders.
 */

import type { RenderContext, LayerData } from "../RenderLayer";

export interface RetrievalData {
  highlights: Array<{
    id: string;
    bounds: { x: number; y: number; width: number; height: number };
    similarity: number;
  }>;
}

export function renderRetrievalHighlights(
  ctx: CanvasRenderingContext2D,
  data: LayerData,
  context: RenderContext
): void {
  const retrievalData = data as unknown as RetrievalData;
  const { coordinateSystem, zoom } = context;

  for (const highlight of retrievalData.highlights) {
    // Check if bounds are in viewport
    const viewportBounds = coordinateSystem.boundsToViewport(highlight.bounds);
    
    if (!isBoundsInViewport(viewportBounds, context.viewportBounds)) {
      continue;
    }

    // Purple dashed border for retrieval highlights
    ctx.strokeStyle = "#8b5cf6";
    ctx.lineWidth = Math.max(1, 3 / zoom);
    ctx.setLineDash([5, 5]);
    
    ctx.strokeRect(
      viewportBounds.x,
      viewportBounds.y,
      viewportBounds.width,
      viewportBounds.height
    );
    
    ctx.setLineDash([]);
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
