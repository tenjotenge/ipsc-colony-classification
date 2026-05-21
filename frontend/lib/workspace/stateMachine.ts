import { create } from "zustand";
import { WorkspaceMode, WORKSPACE_MODES, WorkspaceModeConfig } from "./modes";

interface WorkspaceState {
  mode: WorkspaceMode;
  selectedRunId: string | null;
  selectedAnalysisId: string | null;
  selectedColonyId: string | null;
  selectedDomain: string | null;
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
  viewport: {
    zoom: number;
    pan: { x: number; y: number };
  };
  
  // Actions
  setMode: (mode: WorkspaceMode) => void;
  setSelectedRunId: (id: string | null) => void;
  setSelectedAnalysisId: (id: string | null) => void;
  setSelectedColonyId: (id: string | null) => void;
  setSelectedDomain: (domain: string | null) => void;
  toggleOverlay: (overlay: keyof WorkspaceState["overlayVisibility"]) => void;
  setOverlayVisibility: (visibility: Partial<WorkspaceState["overlayVisibility"]>) => void;
  togglePanel: (panel: keyof WorkspaceState["panelVisibility"]) => void;
  setViewport: (viewport: Partial<WorkspaceState["viewport"]>) => void;
  resetToModeDefaults: (mode: WorkspaceMode) => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set: (partial: Partial<WorkspaceState> | ((state: WorkspaceState) => Partial<WorkspaceState>)) => void) => ({
  mode: "explore",
  selectedRunId: null,
  selectedAnalysisId: null,
  selectedColonyId: null,
  selectedDomain: null,
  overlayVisibility: WORKSPACE_MODES.explore.overlayDefaults,
  panelVisibility: {
    left: true,
    right: true,
    bottom: false,
  },
  viewport: {
    zoom: 1,
    pan: { x: 0, y: 0 },
  },

  setMode: (mode) => {
    set((state) => ({
      mode,
      overlayVisibility: WORKSPACE_MODES[mode].overlayDefaults,
    }));
  },

  setSelectedRunId: (id) => set({ selectedRunId: id }),
  setSelectedAnalysisId: (id) => set({ selectedAnalysisId: id }),
  setSelectedColonyId: (id) => set({ selectedColonyId: id }),
  setSelectedDomain: (domain) => set({ selectedDomain: domain }),

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

  setViewport: (viewport) => {
    set((state) => ({
      viewport: {
        ...state.viewport,
        ...viewport,
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
