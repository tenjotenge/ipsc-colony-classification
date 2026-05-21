/**
 * ViewportTransformer - Legacy compatibility layer
 * 
 * This file provides backward compatibility for existing code.
 * New code should use the centralized CoordinateSystem from lib/coordinates/CoordinateSystem.ts
 * 
 * DEPRECATED: Use CoordinateSystem for new implementations
 */

import {
  CoordinateSystem,
  createCoordinateSystem,
  type ImageSize,
  type ViewportState as CoordinateViewportState,
} from "@/lib/coordinates/CoordinateSystem";

export interface ViewportState {
  zoom: number;
  pan: { x: number; y: number };
  width: number;
  height: number;
}

export interface Transform {
  scale: number;
  translateX: number;
  translateY: number;
}

/**
 * Legacy ViewportTransformer class
 * Maintains backward compatibility while delegating to CoordinateSystem
 */
export class ViewportTransformer {
  private static coordinateSystem: CoordinateSystem | null = null;

  private static getCoordinateSystem(viewport: ViewportState, imageSize?: ImageSize): CoordinateSystem {
    if (!this.coordinateSystem || imageSize) {
      // Default image size if not provided (will be updated when actual size is known)
      const defaultImageSize = imageSize || { width: 2000, height: 2000 };
      this.coordinateSystem = createCoordinateSystem(defaultImageSize, viewport);
    } else {
      this.coordinateSystem.updateViewport(viewport);
    }
    return this.coordinateSystem;
  }

  static imageToViewport(
    imageX: number,
    imageY: number,
    viewport: ViewportState
  ): { x: number; y: number } {
    const coords = this.getCoordinateSystem(viewport).imageToViewport({ x: imageX, y: imageY });
    return coords;
  }

  static viewportToImage(
    viewportX: number,
    viewportY: number,
    viewport: ViewportState
  ): { x: number; y: number } {
    const coords = this.getCoordinateSystem(viewport).viewportToImage({ x: viewportX, y: viewportY });
    return coords;
  }

  static getTransform(viewport: ViewportState): Transform {
    const matrix = this.getCoordinateSystem(viewport).getTransformMatrix();
    return {
      scale: matrix.scale,
      translateX: matrix.translateX,
      translateY: matrix.translateY,
    };
  }

  static boundsToViewport(
    bounds: { x: number; y: number; width: number; height: number },
    viewport: ViewportState
  ): { x: number; y: number; width: number; height: number } {
    return this.getCoordinateSystem(viewport).boundsToViewport(bounds);
  }

  static isPointInViewport(
    x: number,
    y: number,
    viewport: ViewportState
  ): boolean {
    return this.getCoordinateSystem(viewport).isPointInViewport({ x, y });
  }

  static isBoundsInViewport(
    bounds: { x: number; y: number; width: number; height: number },
    viewport: ViewportState
  ): boolean {
    return this.getCoordinateSystem(viewport).isBoundsInViewport(bounds);
  }

  /**
   * Update the image size for the coordinate system
   * Call this when the actual image size is known
   */
  static updateImageSize(imageSize: ImageSize): void {
    if (this.coordinateSystem) {
      this.coordinateSystem.updateImageSize(imageSize);
    }
  }
}
