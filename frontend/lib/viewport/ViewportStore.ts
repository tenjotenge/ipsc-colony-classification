/**
 * Viewport Store - Isolated viewer runtime state
 * 
 * This store is intentionally isolated from React UI rendering flow to prevent
 * pan/zoom operations from triggering broad rerender cascades.
 * 
 * High-frequency viewport updates should NOT trigger React component rerenders.
 * The viewer runtime state remains partially isolated from normal React UI rendering.
 */

import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

export interface ViewportState {
  zoom: number;
  pan: { x: number; y: number };
  bounds: { x: number; y: number; width: number; height: number };
  containerSize: { width: number; height: number };
  isAnimating: boolean;
}

interface ViewportActions {
  setZoom: (zoom: number) => void;
  setPan: (pan: { x: number; y: number }) => void;
  setBounds: (bounds: { x: number; y: number; width: number; height: number }) => void;
  setContainerSize: (size: { width: number; height: number }) => void;
  zoomTo: (zoom: number, center?: { x: number; y: number }) => void;
  panTo: (pan: { x: number; y: number }) => void;
  reset: () => void;
  startAnimation: () => void;
  endAnimation: () => void;
}

type ViewportStore = ViewportState & ViewportActions;

const initialState: ViewportState = {
  zoom: 1,
  pan: { x: 0, y: 0 },
  bounds: { x: 0, y: 0, width: 2000, height: 2000 },
  containerSize: { width: 800, height: 600 },
  isAnimating: false,
};

export const useViewportStore = create<ViewportStore>()(
  subscribeWithSelector((set, get) => ({
    ...initialState,

    setZoom: (zoom) => set({ zoom }),

    setPan: (pan) => set({ pan }),

    setBounds: (bounds) => set({ bounds }),

    setContainerSize: (containerSize) => set({ containerSize }),

    zoomTo: (zoom, center) => {
      const current = get();
      if (center) {
        // Adjust pan to zoom toward center point
        const zoomRatio = zoom / current.zoom;
        const newPan = {
          x: center.x - (center.x - current.pan.x) * zoomRatio,
          y: center.y - (center.y - current.pan.y) * zoomRatio,
        };
        set({ zoom, pan: newPan });
      } else {
        set({ zoom });
      }
    },

    panTo: (pan) => set({ pan }),

    reset: () => set(initialState),

    startAnimation: () => set({ isAnimating: true }),

    endAnimation: () => set({ isAnimating: false }),
  }))
);

/**
 * Selector hook for viewport state that prevents unnecessary rerenders
 * Use this instead of direct store access in React components
 */
export function useViewportState<T>(selector: (state: ViewportState) => T): T {
  return useViewportStore(selector);
}

/**
 * Selector hook for viewport actions
 * Actions don't change frequently, so this is safe to use
 */
export function useViewportActions(): ViewportActions {
  return useViewportStore((state) => ({
    setZoom: state.setZoom,
    setPan: state.setPan,
    setBounds: state.setBounds,
    setContainerSize: state.setContainerSize,
    zoomTo: state.zoomTo,
    panTo: state.panTo,
    reset: state.reset,
    startAnimation: state.startAnimation,
    endAnimation: state.endAnimation,
  }));
}

/**
 * Non-reactive viewport state accessor
 * Use this for high-frequency operations outside React rendering cycle
 * This does NOT trigger React rerenders
 */
export function getViewportState(): ViewportState {
  return useViewportStore.getState();
}

/**
 * Non-reactive viewport action accessor
 * Use this for high-frequency operations outside React rendering cycle
 */
export function getViewportActions(): ViewportActions {
  return useViewportStore.getState();
}
