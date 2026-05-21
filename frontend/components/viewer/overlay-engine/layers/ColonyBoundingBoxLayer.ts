import { ViewportTransformer, ViewportState } from "../ViewportTransformer";

export interface ColonyData {
  id: string;
  bounds: { x: number; y: number; width: number; height: number };
  calibratedScore: number;
  selected?: boolean;
}

export function renderColonyBoundingBoxes(
  ctx: CanvasRenderingContext2D,
  colonies: ColonyData[],
  viewport: ViewportState
): void {
  colonies.forEach((colony) => {
    const bounds = ViewportTransformer.boundsToViewport(colony.bounds, viewport);
    
    if (!ViewportTransformer.isBoundsInViewport(colony.bounds, viewport)) return;

    const score = colony.calibratedScore || 0;
    const color = score >= 0.8 ? "#10b981" : score >= 0.5 ? "#f59e0b" : "#ef4444";
    
    ctx.strokeStyle = color;
    ctx.lineWidth = colony.selected ? 4 / viewport.zoom : 2 / viewport.zoom;
    ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);
  });
}
