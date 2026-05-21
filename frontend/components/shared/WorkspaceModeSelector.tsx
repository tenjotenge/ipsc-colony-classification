"use client";

import React from "react";
import { WORKSPACE_MODES, type WorkspaceMode } from "@/lib/workspace";

interface WorkspaceModeSelectorProps {
  currentMode?: WorkspaceMode;
  onModeChange?: (mode: WorkspaceMode) => void;
}

export const WorkspaceModeSelector: React.FC<WorkspaceModeSelectorProps> = ({
  currentMode = "explore",
  onModeChange,
}) => {
  return (
    <div className="flex items-center gap-1 p-1 rounded bg-secondary border border-border">
      {Object.values(WORKSPACE_MODES).map((mode) => (
        <button
          key={mode.id}
          onClick={() => onModeChange?.(mode.id as WorkspaceMode)}
          className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
            currentMode === mode.id
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary/80"
          }`}
        >
          {mode.label}
        </button>
      ))}
    </div>
  );
};
