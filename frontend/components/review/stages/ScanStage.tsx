"use client";

import React from "react";
import { useReviewWorkflowStore } from "@/lib/review/ReviewWorkflowStore";
import { useColony } from "@/lib/queries/hooks";
import { CalibratedScoreBadge } from "@/components/shared/CalibratedScoreBadge";
import { UncertaintyIndicator } from "@/components/shared/UncertaintyIndicator";

export function ScanStage() {
  const { selectedColonyId, setStage } = useReviewWorkflowStore();
  const { data: colony } = useColony(selectedColonyId || "");

  if (!colony) {
    return (
      <div className="p-3 border border-border bg-card">
        <div className="text-xs text-muted-foreground">No colony selected</div>
      </div>
    );
  }

  const isAnomaly = colony.calibratedScore < 0.5 || colony.uncertainty.total > 0.5;

  return (
    <div className="p-3 border border-border bg-card space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-foreground">Colony #{colony.id}</span>
        {isAnomaly && (
          <span className="text-xs text-red-500 font-medium">Anomaly</span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <div className="text-[10px] text-muted-foreground">Calibrated Score</div>
          <CalibratedScoreBadge score={colony.calibratedScore} />
        </div>
        <div className="space-y-1">
          <div className="text-[10px] text-muted-foreground">Uncertainty</div>
          <div className="flex items-center gap-1">
            <UncertaintyIndicator uncertainty={colony.uncertainty.total} />
            <span className="text-xs text-muted-foreground">{colony.uncertainty.total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <button
        onClick={() => setStage("inspect" as any)}
        className="w-full px-2 py-1 text-xs font-medium rounded border border-border bg-secondary text-foreground hover:bg-secondary/80"
      >
        Inspect Details
      </button>
    </div>
  );
}
