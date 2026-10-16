"use client";

import React, { useEffect, useRef } from "react";
import OpenSeadragon from "openseadragon";
import { OverlayEngine, overlayRegistry, renderScheduler } from "./overlay-engine";
import { ViewportState } from "./overlay-engine/ViewportTransformer";
import { useWorkspace } from "@/lib/workspace";
import { useViewportState, getViewportActions } from "@/lib/viewport/ViewportStore";
import type { DemoColony } from "@/lib/demo/plate";

interface MicroscopyViewerProps {
  imageUrl: string;
  imageWidth?: number;
  onViewportChange?: (viewport: ViewportState) => void;
  regions?: DemoColony[];
  selectedRegionId?: string;
  showRegions?: boolean;
  onRegionSelect?: (id: string) => void;
}

export const MicroscopyViewer: React.FC<MicroscopyViewerProps> = ({
  imageUrl,
  imageWidth = 1024,
  onViewportChange,
  regions = [],
  selectedRegionId,
  showRegions = true,
  onRegionSelect,
}) => {
  const viewerRef = useRef<HTMLDivElement>(null);
  const viewerInstanceRef = useRef<OpenSeadragon.Viewer | null>(null);
  const onRegionSelectRef = useRef(onRegionSelect);
  const selectedRegionRef = useRef(selectedRegionId);
  const showRegionsRef = useRef(showRegions);
  useEffect(() => { onRegionSelectRef.current = onRegionSelect; }, [onRegionSelect]);
  useEffect(() => { selectedRegionRef.current = selectedRegionId; }, [selectedRegionId]);
  useEffect(() => { showRegionsRef.current = showRegions; }, [showRegions]);
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
      prefixUrl: "/vendor/openseadragon/images/",
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

    viewer.addHandler("open", () => {
      for (const region of regions) {
        const element = document.createElement("button");
        element.type = "button";
        element.className = "colony-overlay";
        if (region.id === selectedRegionRef.current) element.classList.add("selected");
        if (!showRegionsRef.current) element.style.display = "none";
        element.dataset.colonyId = region.id;
        element.setAttribute("aria-label", `Select ${region.name}`);
        const label = document.createElement("span");
        label.className = "colony-overlay-label";
        label.textContent = `${region.id}  ·  ${Math.round(region.score * 100)}`;
        element.appendChild(label);
        element.addEventListener("click", (event) => {
          event.stopPropagation();
          onRegionSelectRef.current?.(region.id);
        });
        viewer.addOverlay({
          element,
          location: new OpenSeadragon.Rect(
            region.x / imageWidth,
            region.y / imageWidth,
            region.width / imageWidth,
            region.height / imageWidth
          ),
        });
      }
    });

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
  }, [imageUrl, imageWidth, onViewportChange, regions]);

  useEffect(() => {
    const container = viewerRef.current;
    if (!container) return;
    container.querySelectorAll<HTMLElement>(".colony-overlay").forEach((element) => {
      element.classList.toggle("selected", element.dataset.colonyId === selectedRegionId);
      element.style.display = showRegions ? "block" : "none";
    });
  }, [selectedRegionId, showRegions, viewport]);

  // Update overlay visibility based on workspace state
  useEffect(() => {
    
    overlayRegistry.setVisibility("colony-bounding-box", overlayVisibility.colonyBoundingBoxes);
    overlayRegistry.setVisibility("confidence-heatmap", overlayVisibility.confidenceHeatmap);
    overlayRegistry.setVisibility("entropy-map", overlayVisibility.entropyMap);
    overlayRegistry.setVisibility("uncertainty-region", overlayVisibility.uncertaintyRegions);
    overlayRegistry.setVisibility("retrieval-highlight", overlayVisibility.retrievalHighlights);
    overlayRegistry.setVisibility("cluster-region", overlayVisibility.clusterRegions);
    
    // Trigger re-render
    renderScheduler.schedule();
  }, [overlayVisibility]);

  return (
    <div className="relative w-full h-full bg-background">
      <div ref={viewerRef} className="w-full h-full" />
      <OverlayEngine viewport={viewport} containerRef={viewerRef} />
    </div>
  );
};
