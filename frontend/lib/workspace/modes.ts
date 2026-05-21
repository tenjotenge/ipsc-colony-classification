export type WorkspaceMode =
  | "explore"
  | "review"
  | "validate"
  | "compare"
  | "calibration"
  | "retrieval";

export interface WorkspaceModeConfig {
  id: WorkspaceMode;
  label: string;
  description: string;
  defaultPanels: {
    left?: string[];
    right?: string[];
  };
  overlayDefaults: {
    colonyBoundingBoxes: boolean;
    confidenceHeatmap: boolean;
    entropyMap: boolean;
    uncertaintyRegions: boolean;
    retrievalHighlights: boolean;
    clusterRegions: boolean;
  };
  keyboardShortcuts: Record<string, string>;
}

export const WORKSPACE_MODES: Record<WorkspaceMode, WorkspaceModeConfig> = {
  explore: {
    id: "explore",
    label: "Explore",
    description: "Free exploration of plate imagery",
    defaultPanels: {
      left: ["run-selector", "plate-list"],
      right: ["colony-info"],
    },
    overlayDefaults: {
      colonyBoundingBoxes: true,
      confidenceHeatmap: false,
      entropyMap: false,
      uncertaintyRegions: false,
      retrievalHighlights: false,
      clusterRegions: false,
    },
    keyboardShortcuts: {
      "1": "Toggle colony bounding boxes",
      "2": "Toggle confidence heatmap",
      "h": "Toggle heatmap overlay",
    },
  },
  review: {
    id: "review",
    label: "Review",
    description: "Human-in-the-loop colony review",
    defaultPanels: {
      left: ["colony-list"],
      right: ["colony-info", "evidence", "validation-metrics"],
    },
    overlayDefaults: {
      colonyBoundingBoxes: true,
      confidenceHeatmap: true,
      entropyMap: false,
      uncertaintyRegions: true,
      retrievalHighlights: false,
      clusterRegions: false,
    },
    keyboardShortcuts: {
      "1": "Toggle colony bounding boxes",
      "2": "Toggle confidence heatmap",
      "3": "Toggle uncertainty regions",
      "r": "Toggle retrieval evidence",
      "a": "Accept colony",
      "x": "Reject colony",
    },
  },
  validate: {
    id: "validate",
    label: "Validate",
    description: "Cross-domain validation inspection",
    defaultPanels: {
      left: ["domain-selector"],
      right: ["validation-metrics", "consensus-breakdown", "cross-domain-results"],
    },
    overlayDefaults: {
      colonyBoundingBoxes: true,
      confidenceHeatmap: true,
      entropyMap: true,
      uncertaintyRegions: true,
      retrievalHighlights: false,
      clusterRegions: true,
    },
    keyboardShortcuts: {
      "1": "Toggle colony bounding boxes",
      "2": "Toggle confidence heatmap",
      "3": "Toggle entropy map",
      "4": "Toggle cluster regions",
      "d": "Cycle domains",
    },
  },
  compare: {
    id: "compare",
    label: "Compare",
    description: "Side-by-side analysis comparison",
    defaultPanels: {
      left: ["analysis-selector-a", "analysis-selector-b"],
      right: ["comparison-metrics", "delta-visualization"],
    },
    overlayDefaults: {
      colonyBoundingBoxes: true,
      confidenceHeatmap: true,
      entropyMap: false,
      uncertaintyRegions: false,
      retrievalHighlights: false,
      clusterRegions: false,
    },
    keyboardShortcuts: {
      "1": "Toggle colony bounding boxes",
      "2": "Toggle confidence heatmap",
      "c": "Toggle comparison mode",
    },
  },
  calibration: {
    id: "calibration",
    label: "Calibration",
    description: "Calibration curve and reliability inspection",
    defaultPanels: {
      left: ["run-selector"],
      right: ["calibration-curve", "reliability-diagram", "brier-score"],
    },
    overlayDefaults: {
      colonyBoundingBoxes: false,
      confidenceHeatmap: false,
      entropyMap: false,
      uncertaintyRegions: false,
      retrievalHighlights: false,
      clusterRegions: false,
    },
    keyboardShortcuts: {
      "t": "Adjust temperature",
      "r": "Recalibrate",
    },
  },
  retrieval: {
    id: "retrieval",
    label: "Retrieval",
    description: "Nearest-neighbor retrieval inspection",
    defaultPanels: {
      left: ["colony-selector"],
      right: ["retrieval-neighbors", "embedding-space", "similarity-metrics"],
    },
    overlayDefaults: {
      colonyBoundingBoxes: true,
      confidenceHeatmap: false,
      entropyMap: false,
      uncertaintyRegions: false,
      retrievalHighlights: true,
      clusterRegions: true,
    },
    keyboardShortcuts: {
      "1": "Toggle colony bounding boxes",
      "5": "Toggle retrieval highlights",
      "n": "Next neighbor",
      "p": "Previous neighbor",
    },
  },
};
