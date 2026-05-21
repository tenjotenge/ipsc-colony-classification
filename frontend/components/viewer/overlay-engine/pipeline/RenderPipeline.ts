/**
 * Render Pipeline - Rendering orchestration system
 * 
 * Manages rendering layers, render passes, and invalidation scheduling.
 * Designed for GIS/radiology/game-engine style rendering, not React-style overlays.
 * 
 * Key principles:
 * - Minimal allocation during pan/zoom
 * - Efficient viewport culling
 * - Layer-based rendering with z-index ordering
 * - Dirty tracking for selective redraws
 * - RequestAnimationFrame scheduling
 */

import type { CoordinateSystem } from "@/lib/coordinates/CoordinateSystem";
import type { RenderLayer, LayerConfig, RenderContext } from "./RenderLayer";

// ============================================================================
// Render Pass Configuration
// ============================================================================

export interface RenderPassConfig {
  id: string;
  name: string;
  layerIds: string[];
  enabled: boolean;
}

// ============================================================================
// Render Pipeline State
// ============================================================================

export interface RenderPipelineState {
  layers: Map<string, RenderLayer>;
  passes: Map<string, RenderPassConfig>;
  dirty: boolean;
  lastRenderTime: number;
}

// ============================================================================
// Render Pipeline
// ============================================================================

export class RenderPipeline {
  private state: RenderPipelineState;
  private coordinateSystem: CoordinateSystem;
  private rafId: number | null = null;
  private renderCallback: (() => void) | null = null;

  constructor(coordinateSystem: CoordinateSystem) {
    this.coordinateSystem = coordinateSystem;
    this.state = {
      layers: new Map(),
      passes: new Map(),
      dirty: false,
      lastRenderTime: 0,
    };
  }

  // ============================================================================
  // Layer Management
  // ============================================================================

  addLayer(layer: RenderLayer): void {
    this.state.layers.set(layer.config.id, layer);
    this.markDirty();
  }

  removeLayer(layerId: string): void {
    this.state.layers.delete(layerId);
    this.markDirty();
  }

  getLayer(layerId: string): RenderLayer | undefined {
    return this.state.layers.get(layerId);
  }

  updateLayerData(layerId: string, data: unknown): void {
    const layer = this.state.layers.get(layerId);
    if (layer) {
      layer.setData(data as any);
      this.markDirty();
    }
  }

  updateLayerConfig(layerId: string, updates: Partial<LayerConfig>): void {
    const layer = this.state.layers.get(layerId);
    if (layer) {
      layer.updateConfig(updates);
      this.markDirty();
    }
  }

  // ============================================================================
  // Render Pass Management
  // ============================================================================

  addPass(config: RenderPassConfig): void {
    this.state.passes.set(config.id, config);
  }

  removePass(passId: string): void {
    this.state.passes.delete(passId);
  }

  enablePass(passId: string): void {
    const pass = this.state.passes.get(passId);
    if (pass) {
      pass.enabled = true;
      this.markDirty();
    }
  }

  disablePass(passId: string): void {
    const pass = this.state.passes.get(passId);
    if (pass) {
      pass.enabled = false;
      this.markDirty();
    }
  }

  // ============================================================================
  // Dirty Tracking
  // ============================================================================

  markDirty(): void {
    this.state.dirty = true;
  }

  isDirty(): boolean {
    if (this.state.dirty) return true;

    // Check if any layer is dirty
    for (const layer of this.state.layers.values()) {
      if (layer.isDirty()) return true;
    }

    return false;
  }

  // ============================================================================
  // Rendering
  // ============================================================================

  setRenderCallback(callback: () => void): void {
    this.renderCallback = callback;
  }

  // Hit testing for item selection
  hitTest(point: { x: number; y: number }): { layerId: string; itemId: string } | null {
    // Check layers in reverse z-index order (top to bottom)
    const sortedLayers = Array.from(this.state.layers.values()).sort(
      (a, b) => b.config.zIndex - a.config.zIndex
    );

    for (const layer of sortedLayers) {
      if (!layer.config.visible) continue;
      const itemId = layer.hitTest(point);
      if (itemId) {
        return { layerId: layer.config.id, itemId };
      }
    }

    return null;
  }

  scheduleRender(): void {
    if (this.rafId !== null) return;

    this.rafId = requestAnimationFrame(() => {
      this.rafId = null;
      if (this.renderCallback) {
        this.renderCallback();
      }
    });
  }

  render(
    ctx: CanvasRenderingContext2D,
    viewportBounds: { x: number; y: number; width: number; height: number },
    zoom: number
  ): void {
    const renderContext: RenderContext = {
      ctx,
      coordinateSystem: this.coordinateSystem,
      viewportBounds,
      zoom,
    };

    // Clear canvas
    ctx.clearRect(0, 0, viewportBounds.width, viewportBounds.height);

    // Sort layers by z-index
    const sortedLayers = Array.from(this.state.layers.values()).sort(
      (a, b) => a.config.zIndex - b.config.zIndex
    );

    // Render each layer
    for (const layer of sortedLayers) {
      if (layer.config.visible) {
        layer.render(renderContext);
        layer.clearDirty();
      }
    }

    this.state.dirty = false;
    this.state.lastRenderTime = performance.now();
  }

  // ============================================================================
  // Viewport Updates
  // ============================================================================

  updateViewport(viewportBounds: { x: number; y: number; width: number; height: number }, zoom: number): void {
    // Update coordinate system
    // Note: CoordinateSystem handles its own viewport updates
    // This is a placeholder for future viewport-specific logic
    this.markDirty();
  }

  // ============================================================================
  // Cleanup
  // ============================================================================

  dispose(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.state.layers.clear();
    this.state.passes.clear();
  }
}
