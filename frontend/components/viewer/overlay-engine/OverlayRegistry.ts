export type OverlayType =
  | "colony-bounding-box"
  | "confidence-heatmap"
  | "entropy-map"
  | "uncertainty-region"
  | "retrieval-highlight"
  | "cluster-region";

export interface OverlayConfig {
  id: OverlayType;
  label: string;
  zIndex: number;
  opacity: number;
  visible: boolean;
  renderStrategy: "canvas" | "svg" | "webgl";
}

export interface OverlayData {
  type: OverlayType;
  data: any;
  metadata?: Record<string, any>;
}

class OverlayRegistry {
  private overlays: Map<OverlayType, OverlayConfig> = new Map();
  private overlayData: Map<OverlayType, OverlayData> = new Map();

  constructor() {
    this.initializeDefaultOverlays();
  }

  private initializeDefaultOverlays(): void {
    const defaultOverlays: OverlayConfig[] = [
      {
        id: "colony-bounding-box",
        label: "Colony Bounding Boxes",
        zIndex: 10,
        opacity: 0.8,
        visible: false,
        renderStrategy: "canvas",
      },
      {
        id: "confidence-heatmap",
        label: "Confidence Heatmap",
        zIndex: 5,
        opacity: 0.6,
        visible: false,
        renderStrategy: "canvas",
      },
      {
        id: "entropy-map",
        label: "Entropy Map",
        zIndex: 6,
        opacity: 0.6,
        visible: false,
        renderStrategy: "canvas",
      },
      {
        id: "uncertainty-region",
        label: "Uncertainty Regions",
        zIndex: 7,
        opacity: 0.5,
        visible: false,
        renderStrategy: "canvas",
      },
      {
        id: "retrieval-highlight",
        label: "Retrieval Highlights",
        zIndex: 8,
        opacity: 0.7,
        visible: false,
        renderStrategy: "canvas",
      },
      {
        id: "cluster-region",
        label: "Cluster Regions",
        zIndex: 9,
        opacity: 0.4,
        visible: false,
        renderStrategy: "canvas",
      },
    ];

    defaultOverlays.forEach((overlay) => {
      this.overlays.set(overlay.id, overlay);
    });
  }

  register(config: OverlayConfig): void {
    this.overlays.set(config.id, config);
  }

  get(id: OverlayType): OverlayConfig | undefined {
    return this.overlays.get(id);
  }

  getAll(): OverlayConfig[] {
    return Array.from(this.overlays.values()).sort((a, b) => a.zIndex - b.zIndex);
  }

  getVisible(): OverlayConfig[] {
    return this.getAll().filter((o) => o.visible);
  }

  setData(data: OverlayData): void {
    this.overlayData.set(data.type, data);
  }

  getData(type: OverlayType): OverlayData | undefined {
    return this.overlayData.get(type);
  }

  setVisibility(id: OverlayType, visible: boolean): void {
    const overlay = this.overlays.get(id);
    if (overlay) {
      overlay.visible = visible;
      this.overlays.set(id, overlay);
    }
  }

  setOpacity(id: OverlayType, opacity: number): void {
    const overlay = this.overlays.get(id);
    if (overlay) {
      overlay.opacity = opacity;
      this.overlays.set(id, overlay);
    }
  }

  setZIndex(id: OverlayType, zIndex: number): void {
    const overlay = this.overlays.get(id);
    if (overlay) {
      overlay.zIndex = zIndex;
      this.overlays.set(id, overlay);
    }
  }
}

export const overlayRegistry = new OverlayRegistry();
