"use client";

import React from "react";
import { useReviewWorkflowStore } from "@/lib/review/ReviewWorkflowStore";
import { useColony } from "@/lib/queries/hooks";
import { CalibratedScoreBadge } from "@/components/shared/CalibratedScoreBadge";
import { UncertaintyIndicator } from "@/components/shared/UncertaintyIndicator";

export function InspectStage() {
  const { selectedColonyId } = useReviewWorkflowStore();
  const { data: colony } = useColony(selectedColonyId || "");

  if (!colony) {
    return (
      <div className="p-3 border border-border bg-card">
        <div className="text-xs text-muted-foreground">No colony selected</div>
      </div>
    );
  }

  return (
    <div className="p-3 border border-border bg-card space-y-3">
      <div>
        <h3 className="text-xs font-semibold text-foreground mb-2">Colony Details</h3>
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">ID</span>
            <span className="text-foreground">{colony.id}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Position</span>
            <span className="text-foreground">({colony.position.x.toFixed(0)}, {colony.position.y.toFixed(0)})</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Cluster</span>
            <span className="text-foreground">{colony.clusterId || "N/A"}</span>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-xs font-semibold text-foreground mb-2">Metrics</h3>
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-xs">
            <span className="text-muted-foreground">Calibrated Score</span>
            <CalibratedScoreBadge score={colony.calibratedScore} />
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-muted-foreground">Uncertainty</span>
            <div className="flex items-center gap-1">
              <UncertaintyIndicator uncertainty={colony.uncertainty.total} />
              <span className="text-foreground">{colony.uncertainty.total.toFixed(2)}</span>
            </div>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Perturbation Stability</span>
            <span className="text-foreground">{colony.perturbationStability.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Entropy</span>
            <span className="text-foreground">{colony.entropy.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Domain Agreement</span>
            <span className="text-foreground">{colony.domainAgreement.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Retrieval Consistency</span>
            <span className="text-foreground">{colony.retrievalConsistency.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-xs font-semibold text-foreground mb-2">Uncertainty Breakdown</h3>
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Calibration</span>
            <span className="text-foreground">{colony.uncertainty.calibration.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Domain</span>
            <span className="text-foreground">{colony.uncertainty.domain.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Retrieval</span>
            <span className="text-foreground">{colony.uncertainty.retrieval.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Spatial</span>
            <span className="text-foreground">{colony.uncertainty.spatial.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
