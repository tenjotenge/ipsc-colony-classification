"use client";

import React, { useEffect, useRef, useMemo } from "react";
import { overlayRegistry, OverlayType } from "./OverlayRegistry";
import { renderScheduler } from "./RenderScheduler";
import { ViewportTransformer, ViewportState } from "./ViewportTransformer";
import { CoordinateSystem, createCoordinateSystem } from "@/lib/coordinates/CoordinateSystem";
import { RenderPipeline, RenderLayer, LayerTypes } from "./pipeline";
import {
  renderColonyBoundingBoxes,
  renderUncertaintyRegions,
  renderRetrievalHighlights,
  renderHeatmap,
  renderClusterRegions,
} from "./pipeline/renderers";

interface OverlayEngineProps {
  viewport: ViewportState;
  containerRef: React.RefObject<HTMLDivElement>;
  imageSize?: { width: number; height: number };
}

export const OverlayEngine: React.FC<OverlayEngineProps> = ({
  viewport,
  containerRef,
  imageSize = { width: 2000, height: 2000 },
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pipelineRef = useRef<RenderPipeline | null>(null);
  const coordinateSystemRef = useRef<CoordinateSystem | null>(null);

  // Initialize coordinate system and pipeline once
  useEffect(() => {
    const coordinateSystem = createCoordinateSystem(imageSize, viewport);
    coordinateSystemRef.current = coordinateSystem;

    const pipeline = new RenderPipeline(coordinateSystem);
    pipelineRef.current = pipeline;

    // Initialize layers with render functions
    const colonyLayer = new RenderLayer(
      {
        id: "colony-bounding-box",
        type: LayerTypes.ColonyBoundingBoxes,
        zIndex: 10,
        opacity: 1.0,
        visible: false,
      },
      renderColonyBoundingBoxes
    );

    const uncertaintyLayer = new RenderLayer(
      {
        id: "uncertainty-region",
        type: LayerTypes.UncertaintyRegions,
        zIndex: 5,
        opacity: 1.0,
        visible: false,
      },
      renderUncertaintyRegions
    );

    const retrievalLayer = new RenderLayer(
      {
        id: "retrieval-highlight",
        type: LayerTypes.RetrievalHighlights,
        zIndex: 15,
        opacity: 1.0,
        visible: false,
      },
      renderRetrievalHighlights
    );

    const heatmapLayer = new RenderLayer(
      {
        id: "confidence-heatmap",
        type: LayerTypes.ConfidenceHeatmap,
        zIndex: 1,
        opacity: 0.6,
        visible: false,
      },
      (ctx, data, context) => renderHeatmap(ctx, data, context)
    );

    const entropyLayer = new RenderLayer(
      {
        id: "entropy-map",
        type: LayerTypes.EntropyMap,
        zIndex: 1,
        opacity: 0.6,
        visible: false,
      },
      (ctx, data, context) => renderHeatmap(ctx, data, context)
    );

    const clusterLayer = new RenderLayer(
      {
        id: "cluster-region",
        type: LayerTypes.ClusterRegions,
        zIndex: 8,
        opacity: 1.0,
        visible: false,
      },
      renderClusterRegions
    );

    pipeline.addLayer(colonyLayer);
    pipeline.addLayer(uncertaintyLayer);
    pipeline.addLayer(retrievalLayer);
    pipeline.addLayer(heatmapLayer);
    pipeline.addLayer(entropyLayer);
    pipeline.addLayer(clusterLayer);

    return () => {
      pipeline.dispose();
    };
  }, [imageSize]);

  // Sync overlay data from registry to pipeline
  useEffect(() => {
    const pipeline = pipelineRef.current;
    if (!pipeline) return;

    const overlays = overlayRegistry.getVisible();

    overlays.forEach((overlay) => {
      const data = overlayRegistry.getData(overlay.id);
      if (!data) return;

      // Update layer data
      pipeline.updateLayerData(overlay.id, data.data);

      // Update layer visibility and opacity
      pipeline.updateLayerConfig(overlay.id, {
        visible: overlay.visible,
        opacity: overlay.opacity,
      });
    });
  });

  // Update coordinate system on viewport change
  useEffect(() => {
    const coordinateSystem = coordinateSystemRef.current;
    if (coordinateSystem) {
      coordinateSystem.updateViewport(viewport);
    }
  }, [viewport]);

  // Canvas setup and rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    const pipeline = pipelineRef.current;

    if (!canvas || !container || !pipeline) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Resize canvas to match container
    const resize = () => {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
    };

    resize();
    window.addEventListener("resize", resize);

    // Register render callback
    const renderCallback = () => {
      if (!pipeline) return;
      pipeline.render(ctx, { x: 0, y: 0, width: canvas.width, height: canvas.height }, viewport.zoom);
    };

    pipeline.setRenderCallback(renderCallback);

    const cleanup = renderScheduler.register(renderCallback);

    // Initial render
    renderScheduler.schedule();

    return () => {
      window.removeEventListener("resize", resize);
      cleanup();
    };
  }, [viewport, containerRef]);

  // Schedule render on viewport change
  useEffect(() => {
    renderScheduler.schedule();
  }, [viewport]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{ width: "100%", height: "100%" }}
    />
  );
};
