/**
 * Centralized coordinate transformation system
 * 
 * This is a foundational primitive - all coordinate conversions must flow through here.
 * Do NOT scatter coordinate logic across overlay renderers or components.
 * 
 * Supported coordinate spaces:
 * - Image: Original image pixel coordinates
 * - Viewport: Canvas viewport coordinates (screen-space)
 * - Normalized: 0-1 range relative to image bounds
 * - Screen: Browser screen coordinates (for mouse events)
 * - Tile: Deep zoom tile coordinates (future)
 * 
 * Future extensions:
 * - Multi-viewer synchronization
 * - Tile-aware transforms
 * - Coordinate space validation
 */

// ============================================================================
// Coordinate Space Definitions
// ============================================================================

export interface ImageCoords {
  x: number;
  y: number;
}

export interface ViewportCoords {
  x: number;
  y: number;
}

export interface NormalizedCoords {
  x: number; // 0-1
  y: number; // 0-1
}

export interface ScreenCoords {
  x: number;
  y: number;
}

export interface TileCoords {
  level: number;
  x: number;
  y: number;
}

export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ImageSize {
  width: number;
  height: number;
}

export interface ViewportState {
  zoom: number;
  pan: { x: number; y: number };
  width: number;
  height: number;
}

// ============================================================================
// Transform Matrix
// ============================================================================

export interface TransformMatrix {
  scale: number;
  translateX: number;
  translateY: number;
}

// ============================================================================
// Coordinate System
// ============================================================================

export class CoordinateSystem {
  private imageSize: ImageSize;
  private viewportState: ViewportState;
  private canvasOffset: { x: number; y: number };

  constructor(
    imageSize: ImageSize,
    viewportState: ViewportState,
    canvasOffset: { x: number; y: number } = { x: 0, y: 0 }
  ) {
    this.imageSize = imageSize;
    this.viewportState = viewportState;
    this.canvasOffset = canvasOffset;
  }

  // Update viewport state (called during pan/zoom)
  updateViewport(viewportState: ViewportState): void {
    this.viewportState = viewportState;
  }

  // Update image size (called when image changes)
  updateImageSize(imageSize: ImageSize): void {
    this.imageSize = imageSize;
  }

  // Update canvas offset (called when canvas position changes)
  updateCanvasOffset(offset: { x: number; y: number }): void {
    this.canvasOffset = offset;
  }

  // ============================================================================
  // Image ↔ Viewport Transforms
  // ============================================================================

  imageToViewport(coords: ImageCoords): ViewportCoords {
    const { zoom, pan, width, height } = this.viewportState;
    const scale = zoom;
    const offsetX = width / 2 + pan.x;
    const offsetY = height / 2 + pan.y;

    return {
      x: coords.x * scale + offsetX,
      y: coords.y * scale + offsetY,
    };
  }

  viewportToImage(coords: ViewportCoords): ImageCoords {
    const { zoom, pan, width, height } = this.viewportState;
    const scale = zoom;
    const offsetX = width / 2 + pan.x;
    const offsetY = height / 2 + pan.y;

    return {
      x: (coords.x - offsetX) / scale,
      y: (coords.y - offsetY) / scale,
    };
  }

  // ============================================================================
  // Image ↔ Normalized Transforms
  // ============================================================================

  imageToNormalized(coords: ImageCoords): NormalizedCoords {
    return {
      x: coords.x / this.imageSize.width,
      y: coords.y / this.imageSize.height,
    };
  }

  normalizedToImage(coords: NormalizedCoords): ImageCoords {
    return {
      x: coords.x * this.imageSize.width,
      y: coords.y * this.imageSize.height,
    };
  }

  // ============================================================================
  // Viewport ↔ Normalized Transforms
  // ============================================================================

  viewportToNormalized(coords: ViewportCoords): NormalizedCoords {
    const imageCoords = this.viewportToImage(coords);
    return this.imageToNormalized(imageCoords);
  }

  normalizedToViewport(coords: NormalizedCoords): ViewportCoords {
    const imageCoords = this.normalizedToImage(coords);
    return this.imageToViewport(imageCoords);
  }

  // ============================================================================
  // Screen ↔ Viewport Transforms
  // ============================================================================

  screenToViewport(coords: ScreenCoords): ViewportCoords {
    return {
      x: coords.x - this.canvasOffset.x,
      y: coords.y - this.canvasOffset.y,
    };
  }

  viewportToScreen(coords: ViewportCoords): ScreenCoords {
    return {
      x: coords.x + this.canvasOffset.x,
      y: coords.y + this.canvasOffset.y,
    };
  }

  // ============================================================================
  // Screen ↔ Image Transforms
  // ============================================================================

  screenToImage(coords: ScreenCoords): ImageCoords {
    const viewportCoords = this.screenToViewport(coords);
    return this.viewportToImage(viewportCoords);
  }

  imageToScreen(coords: ImageCoords): ScreenCoords {
    const viewportCoords = this.imageToViewport(coords);
    return this.viewportToScreen(viewportCoords);
  }

  // ============================================================================
  // Bounds Transforms
  // ============================================================================

  boundsToViewport(bounds: Bounds): Bounds {
    const topLeft = this.imageToViewport({ x: bounds.x, y: bounds.y });
    const bottomRight = this.imageToViewport({
      x: bounds.x + bounds.width,
      y: bounds.y + bounds.height,
    });

    return {
      x: topLeft.x,
      y: topLeft.y,
      width: bottomRight.x - topLeft.x,
      height: bottomRight.y - topLeft.y,
    };
  }

  boundsToImage(bounds: Bounds): Bounds {
    const topLeft = this.viewportToImage({ x: bounds.x, y: bounds.y });
    const bottomRight = this.viewportToImage({
      x: bounds.x + bounds.width,
      y: bounds.y + bounds.height,
    });

    return {
      x: topLeft.x,
      y: topLeft.y,
      width: bottomRight.x - topLeft.x,
      height: bottomRight.y - topLeft.y,
    };
  }

  boundsToNormalized(bounds: Bounds): Bounds {
    const topLeft = this.imageToNormalized({ x: bounds.x, y: bounds.y });
    const bottomRight = this.imageToNormalized({
      x: bounds.x + bounds.width,
      y: bounds.y + bounds.height,
    });

    return {
      x: topLeft.x,
      y: topLeft.y,
      width: bottomRight.x - topLeft.x,
      height: bottomRight.y - topLeft.y,
    };
  }

  // ============================================================================
  // Visibility Tests
  // ============================================================================

  isPointInViewport(coords: ViewportCoords): boolean {
    return (
      coords.x >= 0 &&
      coords.x <= this.viewportState.width &&
      coords.y >= 0 &&
      coords.y <= this.viewportState.height
    );
  }

  isPointInImage(coords: ImageCoords): boolean {
    return (
      coords.x >= 0 &&
      coords.x <= this.imageSize.width &&
      coords.y >= 0 &&
      coords.y <= this.imageSize.height
    );
  }

  isBoundsInViewport(bounds: Bounds): boolean {
    const viewportBounds = this.boundsToViewport(bounds);
    return (
      viewportBounds.x < this.viewportState.width &&
      viewportBounds.y < this.viewportState.height &&
      viewportBounds.x + viewportBounds.width > 0 &&
      viewportBounds.y + viewportBounds.height > 0
    );
  }

  // ============================================================================
  // Transform Matrix
  // ============================================================================

  getTransformMatrix(): TransformMatrix {
    const { zoom, pan, width, height } = this.viewportState;
    return {
      scale: zoom,
      translateX: width / 2 + pan.x,
      translateY: height / 2 + pan.y,
    };
  }

  // ============================================================================
  // Scale Helpers
  // ============================================================================

  getImageToViewportScale(): number {
    return this.viewportState.zoom;
  }

  getViewportToImageScale(): number {
    return 1 / this.viewportState.zoom;
  }

  scaleLengthToViewport(length: number): number {
    return length * this.getImageToViewportScale();
  }

  scaleLengthToImage(length: number): number {
    return length * this.getViewportToImageScale();
  }

  // ============================================================================
  // Tile Coordinates (Future)
  // ============================================================================

  // Placeholder for future tile-based coordinate system
  // This will integrate with OpenSeadragon's tile structure
  imageToTile(coords: ImageCoords, level: number): TileCoords {
    // TODO: Implement when tile system is integrated
    throw new Error("Tile coordinates not yet implemented");
  }

  tileToImage(tile: TileCoords): ImageCoords {
    // TODO: Implement when tile system is integrated
    throw new Error("Tile coordinates not yet implemented");
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

export function createCoordinateSystem(
  imageSize: ImageSize,
  viewportState: ViewportState,
  canvasOffset?: { x: number; y: number }
): CoordinateSystem {
  return new CoordinateSystem(imageSize, viewportState, canvasOffset);
}
