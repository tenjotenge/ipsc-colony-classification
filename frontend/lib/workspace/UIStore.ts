/**
 * UI Store - UI state management
 * 
 * Manages UI-only state: workspace mode, overlay visibility, panel visibility.
 * Separated from selection state and viewport state for clear boundaries.
 */

import { create } from "zustand";
import { WorkspaceMode, WORKSPACE_MODES } from "./modes";

interface UIState {
  mode: WorkspaceMode;
  overlayVisibility: {
    colonyBoundingBoxes: boolean;
    confidenceHeatmap: boolean;
    entropyMap: boolean;
    uncertaintyRegions: boolean;
    retrievalHighlights: boolean;
    clusterRegions: boolean;
  };
  panelVisibility: {
    left: boolean;
    right: boolean;
    bottom: boolean;
  };
  
  // Actions
  setMode: (mode: WorkspaceMode) => void;
  toggleOverlay: (overlay: keyof UIState["overlayVisibility"]) => void;
  setOverlayVisibility: (visibility: Partial<UIState["overlayVisibility"]>) => void;
  togglePanel: (panel: keyof UIState["panelVisibility"]) => void;
  setPanelVisibility: (visibility: Partial<UIState["panelVisibility"]>) => void;
  resetToModeDefaults: (mode: WorkspaceMode) => void;
}

export const useUIStore = create<UIState>((set) => ({
  mode: "explore",
  overlayVisibility: WORKSPACE_MODES.explore.overlayDefaults,
  panelVisibility: {
    left: true,
    right: true,
    bottom: false,
  },

  setMode: (mode) => {
    set((state) => ({
      mode,
      overlayVisibility: WORKSPACE_MODES[mode].overlayDefaults,
    }));
  },

  toggleOverlay: (overlay) => {
    set((state) => ({
      overlayVisibility: {
        ...state.overlayVisibility,
        [overlay]: !state.overlayVisibility[overlay],
      },
    }));
  },

  setOverlayVisibility: (visibility) => {
    set((state) => ({
      overlayVisibility: {
        ...state.overlayVisibility,
        ...visibility,
      },
    }));
  },

  togglePanel: (panel) => {
    set((state) => ({
      panelVisibility: {
        ...state.panelVisibility,
        [panel]: !state.panelVisibility[panel],
      },
    }));
  },

  setPanelVisibility: (visibility) => {
    set((state) => ({
      panelVisibility: {
        ...state.panelVisibility,
        ...visibility,
      },
    }));
  },

  resetToModeDefaults: (mode) => {
    set({
      mode,
      overlayVisibility: WORKSPACE_MODES[mode].overlayDefaults,
    });
  },
}));
