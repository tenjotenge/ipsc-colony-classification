/**
 * Colony Bounding Box Renderer
 * 
 * Render function for colony bounding boxes with viewport culling and color coding.
 */

import type { RenderContext, LayerData } from "../RenderLayer";
import type { CoordinateSystem } from "@/lib/coordinates/CoordinateSystem";

export interface ColonyData {
  colonies: Array<{
    id: string;
    bounds: { x: number; y: number; width: number; height: number };
    calibratedScore: number;
    selected?: boolean;
  }>;
}

export function renderColonyBoundingBoxes(
  ctx: CanvasRenderingContext2D,
  data: LayerData,
  context: RenderContext
): void {
  const colonyData = data as unknown as ColonyData;
  const { coordinateSystem, zoom } = context;

  for (const colony of colonyData.colonies) {
    // Check if bounds are in viewport
    const viewportBounds = coordinateSystem.boundsToViewport(colony.bounds);
    
    if (!isBoundsInViewport(viewportBounds, context.viewportBounds)) {
      continue;
    }

    // Color based on calibrated score
    const color = getScoreColor(colony.calibratedScore);
    
    // Scale line width inversely with zoom for consistent appearance
    const lineWidth = Math.max(1, 2 / zoom);

    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;

    // Highlight selected colonies
    if (colony.selected) {
      ctx.fillStyle = color + "20"; // 20 hex = ~12% opacity
      ctx.fillRect(viewportBounds.x, viewportBounds.y, viewportBounds.width, viewportBounds.height);
    }

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

function getScoreColor(score: number): string {
  // Scientific color palette - calibrated scores
  if (score >= 0.8) return "#10b981"; // green
  if (score >= 0.5) return "#f59e0b"; // amber
  return "#ef4444"; // red
}
