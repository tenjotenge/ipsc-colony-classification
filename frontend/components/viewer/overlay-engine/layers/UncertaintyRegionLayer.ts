import { ViewportTransformer, ViewportState } from "../ViewportTransformer";

export interface UncertaintyRegion {
  bounds: { x: number; y: number; width: number; height: number };
  uncertainty: number;
}

export function renderUncertaintyRegions(
  ctx: CanvasRenderingContext2D,
  regions: UncertaintyRegion[],
  viewport: ViewportState
): void {
  regions.forEach((region) => {
    const bounds = ViewportTransformer.boundsToViewport(region.bounds, viewport);
    
    if (!ViewportTransformer.isBoundsInViewport(region.bounds, viewport)) return;

    const uncertainty = region.uncertainty || 0;
    const color = uncertainty >= 0.7 
      ? "rgba(236, 72, 153, 0.3)" 
      : uncertainty >= 0.4 
      ? "rgba(139, 92, 246, 0.3)" 
      : "rgba(59, 130, 246, 0.3)";
    
    ctx.fillStyle = color;
    ctx.fillRect(bounds.x, bounds.y, bounds.width, bounds.height);
  });
}
