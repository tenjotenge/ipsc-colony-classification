import { useUIStore } from "./UIStore";
import { useSelectionStore } from "./SelectionStore";
import { useViewportState } from "../viewport/ViewportStore";
import { WorkspaceMode } from "./modes";

export function useWorkspace() {
  const uiStore = useUIStore();
  const selectionStore = useSelectionStore();
  const viewport = useViewportState((state) => ({
    zoom: state.zoom,
    pan: state.pan,
  }));

  return {
    // UI state
    mode: uiStore.mode,
    overlayVisibility: uiStore.overlayVisibility,
    panelVisibility: uiStore.panelVisibility,
    setMode: uiStore.setMode,
    toggleOverlay: uiStore.toggleOverlay,
    setOverlayVisibility: uiStore.setOverlayVisibility,
    togglePanel: uiStore.togglePanel,
    setPanelVisibility: uiStore.setPanelVisibility,
    resetToModeDefaults: uiStore.resetToModeDefaults,

    // Selection state
    selectedRunId: selectionStore.selectedRunId,
    selectedAnalysisId: selectionStore.selectedAnalysisId,
    selectedColonyId: selectionStore.selectedColonyId,
    selectedDomain: selectionStore.selectedDomain,
    setSelectedRunId: selectionStore.setSelectedRunId,
    setSelectedAnalysisId: selectionStore.setSelectedAnalysisId,
    setSelectedColonyId: selectionStore.setSelectedColonyId,
    setSelectedDomain: selectionStore.setSelectedDomain,
    clearSelection: selectionStore.clearSelection,

    // Viewport state
    viewport,
  };
}

export function useWorkspaceMode(mode: WorkspaceMode) {
  const setMode = useUIStore((state) => state.setMode);
  const resetToModeDefaults = useUIStore((state) => state.resetToModeDefaults);

  const activateMode = () => {
    resetToModeDefaults(mode);
  };

  return {
    activateMode,
    setMode,
  };
}
