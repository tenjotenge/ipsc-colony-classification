import { ViewportTransformer, ViewportState } from "../ViewportTransformer";

export interface HeatmapData {
  url: string;
  width: number;
  height: number;
  min: number;
  max: number;
}

export function renderConfidenceHeatmap(
  ctx: CanvasRenderingContext2D,
  heatmap: HeatmapData,
  viewport: ViewportState,
  image: HTMLImageElement | null
): void {
  if (!image) return;

  const bounds = ViewportTransformer.boundsToViewport(
    { x: 0, y: 0, width: heatmap.width, height: heatmap.height },
    viewport
  );

  ctx.globalAlpha = 0.6;
  ctx.drawImage(image, bounds.x, bounds.y, bounds.width, bounds.height);
  ctx.globalAlpha = 1.0;
}
