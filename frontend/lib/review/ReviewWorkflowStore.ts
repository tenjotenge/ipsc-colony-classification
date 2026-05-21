/**
 * Review Workflow Store - Review cognition flow state management
 * 
 * Manages the review cognition flow: scan → inspect → compare → evaluate → validate.
 * Optimized for scientific review workflow with minimal cognitive interruption.
 */

import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

export enum ReviewStage {
  Scan = "scan",
  Inspect = "inspect",
  Compare = "compare",
  Evaluate = "evaluate",
  Validate = "validate",
}

export interface ReviewDecision {
  colonyId: string;
  accepted: boolean;
  confidence: number;
  reasoning?: string;
  timestamp: number;
}

interface ReviewWorkflowState {
  currentStage: ReviewStage;
  selectedColonyId: string | null;
  comparisonColonyIds: string[];
  decisions: Map<string, ReviewDecision>;
  reviewQueue: string[];
  currentIndex: number;
  isReviewing: boolean;
  
  // Actions
  setStage: (stage: ReviewStage) => void;
  selectColony: (colonyId: string) => void;
  addComparisonColony: (colonyId: string) => void;
  removeComparisonColony: (colonyId: string) => void;
  clearComparisons: () => void;
  makeDecision: (decision: ReviewDecision) => void;
  startReview: (queue: string[]) => void;
  nextColony: () => void;
  previousColony: () => void;
  endReview: () => void;
  reset: () => void;
}

export const useReviewWorkflowStore = create<ReviewWorkflowState>()(
  subscribeWithSelector((set, get) => ({
    currentStage: ReviewStage.Scan,
    selectedColonyId: null,
    comparisonColonyIds: [],
    decisions: new Map(),
    reviewQueue: [],
    currentIndex: 0,
    isReviewing: false,

    setStage: (stage) => set({ currentStage: stage }),

    selectColony: (colonyId) => set({ selectedColonyId: colonyId }),

    addComparisonColony: (colonyId) => {
      set((state) => ({
        comparisonColonyIds: [...state.comparisonColonyIds, colonyId],
      }));
    },

    removeComparisonColony: (colonyId) => {
      set((state) => ({
        comparisonColonyIds: state.comparisonColonyIds.filter((id) => id !== colonyId),
      }));
    },

    clearComparisons: () => set({ comparisonColonyIds: [] }),

    makeDecision: (decision) => {
      set((state) => {
        const newDecisions = new Map(state.decisions);
        newDecisions.set(decision.colonyId, decision);
        return { decisions: newDecisions };
      });
    },

    startReview: (queue) => {
      set({
        reviewQueue: queue,
        currentIndex: 0,
        isReviewing: true,
        currentStage: ReviewStage.Scan,
        selectedColonyId: queue[0] || null,
      });
    },

    nextColony: () => {
      const state = get();
      if (state.currentIndex < state.reviewQueue.length - 1) {
        const nextIndex = state.currentIndex + 1;
        set({
          currentIndex: nextIndex,
          selectedColonyId: state.reviewQueue[nextIndex],
          currentStage: ReviewStage.Scan,
          comparisonColonyIds: [],
        });
      }
    },

    previousColony: () => {
      const state = get();
      if (state.currentIndex > 0) {
        const prevIndex = state.currentIndex - 1;
        set({
          currentIndex: prevIndex,
          selectedColonyId: state.reviewQueue[prevIndex],
          currentStage: ReviewStage.Scan,
          comparisonColonyIds: [],
        });
      }
    },

    endReview: () => {
      set({
        isReviewing: false,
        currentStage: ReviewStage.Scan,
        selectedColonyId: null,
        comparisonColonyIds: [],
        currentIndex: 0,
      });
    },

    reset: () => {
      set({
        currentStage: ReviewStage.Scan,
        selectedColonyId: null,
        comparisonColonyIds: [],
        decisions: new Map(),
        reviewQueue: [],
        currentIndex: 0,
        isReviewing: false,
      });
    },
  }))
);

/**
 * Non-reactive accessors for high-frequency operations
 */
export function getReviewWorkflowState() {
  return useReviewWorkflowStore.getState();
}

export function getReviewWorkflowActions() {
  return useReviewWorkflowStore.getState();
}
