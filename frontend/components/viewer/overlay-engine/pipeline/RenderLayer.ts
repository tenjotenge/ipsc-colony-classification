/**
 * Render Layer - Rendering pipeline primitive
 * 
 * This is NOT a React component. It's a rendering primitive in the style of
 * GIS tooling, radiology viewers, and game-engine layer systems.
 * 
 * Avoid excessive per-layer object overhead. Focus on:
 * - Efficient rendering
 * - Viewport culling
 * - Spatial indexing
 * - Minimal allocation during pan/zoom
 */

import type { CoordinateSystem } from "@/lib/coordinates/CoordinateSystem";

// ============================================================================
// Layer Types
// ============================================================================

export const LayerTypes = {
  ColonyBoundingBoxes: "colony-bounding-boxes",
  ConfidenceHeatmap: "confidence-heatmap",
  EntropyMap: "entropy-map",
  UncertaintyRegions: "uncertainty-regions",
  RetrievalHighlights: "retrieval-highlights",
  ClusterRegions: "cluster-regions",
  SegmentationMask: "segmentation-mask", // Future
  OperatorAnnotations: "operator-annotations", // Future
} as const;

export type LayerType = typeof LayerTypes[keyof typeof LayerTypes];

// ============================================================================
// Layer Configuration
// ============================================================================

export interface LayerConfig {
  id: string;
  type: LayerType;
  zIndex: number;
  opacity: number;
  visible: boolean;
}

// ============================================================================
// Render Context
// ============================================================================

export interface RenderContext {
  ctx: CanvasRenderingContext2D;
  coordinateSystem: CoordinateSystem;
  viewportBounds: { x: number; y: number; width: number; height: number };
  zoom: number;
}

// ============================================================================
// Layer Data Interface
// ============================================================================

export interface LayerData {
  // Each layer type defines its own data structure
  // This is intentionally generic to allow extensibility
  [key: string]: unknown;
}

// ============================================================================
// Render Function Signature
// ============================================================================

export type RenderFunction = (
  ctx: CanvasRenderingContext2D,
  data: LayerData,
  context: RenderContext
) => void;

// ============================================================================
// Spatial Index (for culling and hit-testing)
// ============================================================================

export interface SpatialIndex {
  // Simple bounds-based index for now
  // Can be upgraded to quadtree, R-tree, etc. for complex scenes
  bounds: Array<{ x: number; y: number; width: number; height: number; id: string }>;
  
  query(viewportBounds: { x: number; y: number; width: number; height: number }): string[];
  hitTest(point: { x: number; y: number }): string | null;
}

// ============================================================================
// Render Layer
// ============================================================================

export class RenderLayer {
  readonly config: LayerConfig;
  private data: LayerData | null = null;
  private spatialIndex: SpatialIndex | null = null;
  private dirty: boolean = true;
  private renderFn: RenderFunction;

  constructor(config: LayerConfig, renderFn: RenderFunction) {
    this.config = config;
    this.renderFn = renderFn;
  }

  // Update layer data
  setData(data: LayerData): void {
    this.data = data;
    this.dirty = true;
    this.buildSpatialIndex();
  }

  // Mark layer as needing redraw
  markDirty(): void {
    this.dirty = true;
  }

  // Check if layer needs redraw
  isDirty(): boolean {
    return this.dirty;
  }

  // Clear dirty flag after render
  clearDirty(): void {
    this.dirty = false;
  }

  // Update configuration
  updateConfig(updates: Partial<LayerConfig>): void {
    Object.assign(this.config, updates);
    this.dirty = true;
  }

  // Build spatial index for culling
  private buildSpatialIndex(): void {
    if (!this.data) return;

    // Default implementation - extract bounds from data
    // Layer-specific implementations can override
    const bounds: Array<{ x: number; y: number; width: number; height: number; id: string }> = [];

    if (this.config.type === LayerTypes.ColonyBoundingBoxes) {
      const colonies = this.data.colonies as Array<{ id: string; bounds: { x: number; y: number; width: number; height: number } }> || [];
      bounds.push(...colonies.map(c => ({ ...c.bounds, id: c.id })));
    } else if (this.config.type === LayerTypes.UncertaintyRegions) {
      const regions = this.data.regions as Array<{ id: string; bounds: { x: number; y: number; width: number; height: number } }> || [];
      bounds.push(...regions.map(r => ({ ...r.bounds, id: r.id })));
    }

    this.spatialIndex = {
      bounds,
      query: (viewportBounds) => {
        // Simple bounds intersection test
        return bounds
          .filter((b) => this.boundsIntersect(b, viewportBounds))
          .map((b) => b.id);
      },
      hitTest: (point) => {
        // Simple point-in-bounds test
        for (const b of bounds) {
          if (
            point.x >= b.x &&
            point.x <= b.x + b.width &&
            point.y >= b.y &&
            point.y <= b.y + b.height
          ) {
            return b.id;
          }
        }
        return null;
      },
    };
  }

  private boundsIntersect(
    a: { x: number; y: number; width: number; height: number },
    b: { x: number; y: number; width: number; height: number }
  ): boolean {
    return (
      a.x < b.x + b.width &&
      a.x + a.width > b.x &&
      a.y < b.y + b.height &&
      a.y + a.height > b.y
    );
  }

  // Get visible items based on viewport
  getVisibleItems(viewportBounds: { x: number; y: number; width: number; height: number }): string[] {
    if (!this.spatialIndex) return [];
    return this.spatialIndex.query(viewportBounds);
  }

  // Hit test for item selection
  hitTest(point: { x: number; y: number }): string | null {
    if (!this.spatialIndex) return null;
    return this.spatialIndex.hitTest(point);
  }

  // Render the layer
  render(context: RenderContext): void {
    if (!this.config.visible || !this.data) return;

    const { ctx } = context;
    
    ctx.save();
    ctx.globalAlpha = this.config.opacity;

    // Call the render function
    this.renderFn(ctx, this.data, context);

    ctx.restore();
  }

  // Get layer data
  getData(): LayerData | null {
    return this.data;
  }
}
