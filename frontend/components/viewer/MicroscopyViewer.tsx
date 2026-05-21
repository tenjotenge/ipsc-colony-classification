"use client";

import React, { useEffect, useRef } from "react";
import OpenSeadragon from "openseadragon";
import { OverlayEngine } from "./overlay-engine";
import { ViewportState } from "./overlay-engine/ViewportTransformer";
import { useWorkspace } from "@/lib/workspace";
import { useViewportState, getViewportActions, getViewportState } from "@/lib/viewport/ViewportStore";

interface MicroscopyViewerProps {
  imageUrl: string;
  onViewportChange?: (viewport: ViewportState) => void;
}

export const MicroscopyViewer: React.FC<MicroscopyViewerProps> = ({
  imageUrl,
  onViewportChange,
}) => {
  const viewerRef = useRef<HTMLDivElement>(null);
  const viewerInstanceRef = useRef<OpenSeadragon.Viewer | null>(null);
  const { overlayVisibility } = useWorkspace();

  // Use isolated viewport state - this won't trigger React rerenders on pan/zoom
  const viewport = useViewportState((state) => ({
    zoom: state.zoom,
    pan: state.pan,
    width: state.containerSize.width,
    height: state.containerSize.height,
  }));

  useEffect(() => {
    if (!viewerRef.current) return;

    const viewer = OpenSeadragon({
      element: viewerRef.current,
      prefixUrl: "https://cdn.jsdelivr.net/npm/openseadragon@4.1.0/build/openseadragon/images/",
      tileSources: {
        type: "image",
        url: imageUrl,
      },
      showNavigator: true,
      showHomeControl: true,
      showFullPageControl: false,
      showZoomControl: true,
      gestureSettingsMouse: {
        flickEnabled: true,
        clickToZoom: true,
        dblClickToZoom: true,
        pinchToZoom: true,
        scrollToZoom: true,
      },
      animationTime: 0.3,
      blendTime: 0.3,
      constrainDuringPan: true,
      visibilityRatio: 0.5,
      minZoomLevel: 0.5,
      maxZoomLevel: 10,
    });

    viewerInstanceRef.current = viewer;

    // Update viewport state on zoom/pan
    // This uses non-reactive access to prevent React rerenders
    const updateViewport = () => {
      const viewportBounds = viewer.viewport.getBounds();
      const zoom = viewer.viewport.getZoom();
      const center = viewer.viewport.getCenter();
      
      // Get content size from the world/item
      const contentSize = viewer.world.getItemCount() > 0 
        ? viewer.world.getItemAt(0).getContentSize()
        : { x: 2000, y: 2000 };
      
      const actions = getViewportActions();
      actions.setZoom(zoom);
      actions.setPan({
        x: center.x * contentSize.x,
        y: center.y * contentSize.y,
      });
      actions.setBounds({
        x: viewportBounds.x * contentSize.x,
        y: viewportBounds.y * contentSize.y,
        width: viewportBounds.width * contentSize.x,
        height: viewportBounds.height * contentSize.y,
      });
      actions.setContainerSize({
        width: viewerRef.current?.clientWidth || 0,
        height: viewerRef.current?.clientHeight || 0,
      });

      // Optional: notify parent component (this is less frequent)
      if (onViewportChange) {
        const newViewport: ViewportState = {
          zoom,
          pan: {
            x: center.x * contentSize.x,
            y: center.y * contentSize.y,
          },
          width: viewerRef.current?.clientWidth || 0,
          height: viewerRef.current?.clientHeight || 0,
        };
        onViewportChange(newViewport);
      }
    };

    // Throttle viewport updates to prevent excessive calls
    let updateScheduled = false;
    const scheduleUpdate = () => {
      if (!updateScheduled) {
        updateScheduled = true;
        requestAnimationFrame(() => {
          updateViewport();
          updateScheduled = false;
        });
      }
    };

    viewer.addHandler("zoom", scheduleUpdate);
    viewer.addHandler("pan", scheduleUpdate);
    viewer.addHandler("resize", scheduleUpdate);

    // Initial viewport update
    setTimeout(updateViewport, 100);

    return () => {
      viewer.destroy();
    };
  }, [imageUrl, onViewportChange]);

  // Update overlay visibility based on workspace state
  useEffect(() => {
    const { overlayRegistry } = require("./overlay-engine");
    
    overlayRegistry.setVisibility("colony-bounding-box", overlayVisibility.colonyBoundingBoxes);
    overlayRegistry.setVisibility("confidence-heatmap", overlayVisibility.confidenceHeatmap);
    overlayRegistry.setVisibility("entropy-map", overlayVisibility.entropyMap);
    overlayRegistry.setVisibility("uncertainty-region", overlayVisibility.uncertaintyRegions);
    overlayRegistry.setVisibility("retrieval-highlight", overlayVisibility.retrievalHighlights);
    overlayRegistry.setVisibility("cluster-region", overlayVisibility.clusterRegions);
    
    // Trigger re-render
    const { renderScheduler } = require("./overlay-engine");
    renderScheduler.schedule();
  }, [overlayVisibility]);

  return (
    <div className="relative w-full h-full bg-background">
      <div ref={viewerRef} className="w-full h-full" />
      <OverlayEngine viewport={viewport} containerRef={viewerRef} />
    </div>
  );
};
