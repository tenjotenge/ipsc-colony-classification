/**
 * Selection Store - Selection state management
 * 
 * Manages selection state: selected run, analysis, colony, domain.
 * Separated from UI state and viewport state for clear boundaries.
 */

import { create } from "zustand";

interface SelectionState {
  selectedRunId: string | null;
  selectedAnalysisId: string | null;
  selectedColonyId: string | null;
  selectedDomain: string | null;
  
  // Actions
  setSelectedRunId: (id: string | null) => void;
  setSelectedAnalysisId: (id: string | null) => void;
  setSelectedColonyId: (id: string | null) => void;
  setSelectedDomain: (domain: string | null) => void;
  clearSelection: () => void;
}

export const useSelectionStore = create<SelectionState>((set) => ({
  selectedRunId: null,
  selectedAnalysisId: null,
  selectedColonyId: null,
  selectedDomain: null,

  setSelectedRunId: (id) => set({ selectedRunId: id }),
  setSelectedAnalysisId: (id) => set({ selectedAnalysisId: id }),
  setSelectedColonyId: (id) => set({ selectedColonyId: id }),
  setSelectedDomain: (domain) => set({ selectedDomain: domain }),

  clearSelection: () => set({
    selectedRunId: null,
    selectedAnalysisId: null,
    selectedColonyId: null,
    selectedDomain: null,
  }),
}));
