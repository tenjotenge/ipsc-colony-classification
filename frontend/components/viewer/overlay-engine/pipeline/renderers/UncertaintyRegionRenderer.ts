/**
 * Uncertainty Region Renderer
 * 
 * Render function for uncertainty regions with viewport culling and color coding.
 */

import type { RenderContext, LayerData } from "../RenderLayer";

export interface UncertaintyData {
  regions: Array<{
    id: string;
    bounds: { x: number; y: number; width: number; height: number };
    uncertainty: number;
  }>;
}

export function renderUncertaintyRegions(
  ctx: CanvasRenderingContext2D,
  data: LayerData,
  context: RenderContext
): void {
  const uncertaintyData = data as unknown as UncertaintyData;
  const { coordinateSystem } = context;

  for (const region of uncertaintyData.regions) {
    // Check if bounds are in viewport
    const viewportBounds = coordinateSystem.boundsToViewport(region.bounds);
    
    if (!isBoundsInViewport(viewportBounds, context.viewportBounds)) {
      continue;
    }

    // Color based on uncertainty level
    const color = getUncertaintyColor(region.uncertainty);
    
    ctx.fillStyle = color;
    ctx.fillRect(
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

function getUncertaintyColor(uncertainty: number): string {
  // Scientific color palette - uncertainty levels
  if (uncertainty >= 0.7) return "rgba(236, 72, 153, 0.3)"; // pink - high
  if (uncertainty >= 0.4) return "rgba(139, 92, 246, 0.3)"; // purple - medium
  return "rgba(59, 130, 246, 0.3)"; // blue - low
}
