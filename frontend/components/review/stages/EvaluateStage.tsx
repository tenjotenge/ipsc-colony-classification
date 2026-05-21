"use client";

import React from "react";
import { useReviewWorkflowStore } from "@/lib/review/ReviewWorkflowStore";
import { useColony, useRetrieval } from "@/lib/queries/hooks";
import { CalibratedScoreBadge } from "@/components/shared/CalibratedScoreBadge";
import { UncertaintyIndicator } from "@/components/shared/UncertaintyIndicator";
import { RetrievalEvidenceCard } from "@/components/evidence/RetrievalEvidenceCard";

export function EvaluateStage() {
  const { selectedColonyId } = useReviewWorkflowStore();
  const { data: colony } = useColony(selectedColonyId || "");
  const { data: retrieval } = useRetrieval(selectedColonyId || "");

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
        <h3 className="text-xs font-semibold text-foreground mb-2">Evaluation Summary</h3>
        <div className="grid grid-cols-2 gap-2">
          <div className="p-2 bg-secondary rounded space-y-1">
            <div className="text-[10px] text-muted-foreground">Calibrated Score</div>
            <CalibratedScoreBadge score={colony.calibratedScore} />
          </div>
          <div className="p-2 bg-secondary rounded space-y-1">
            <div className="text-[10px] text-muted-foreground">Uncertainty</div>
            <div className="flex items-center gap-1">
              <UncertaintyIndicator uncertainty={colony.uncertainty.total} />
              <span className="text-xs text-foreground">{colony.uncertainty.total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-xs font-semibold text-foreground mb-2">Evidence Assessment</h3>
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Perturbation Stability</span>
            <span className={`text-foreground ${colony.perturbationStability >= 0.7 ? "text-green-500" : "text-red-500"}`}>
              {colony.perturbationStability.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Entropy</span>
            <span className={`text-foreground ${colony.entropy <= 0.3 ? "text-green-500" : "text-red-500"}`}>
              {colony.entropy.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Domain Agreement</span>
            <span className={`text-foreground ${colony.domainAgreement >= 0.7 ? "text-green-500" : "text-red-500"}`}>
              {colony.domainAgreement.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Retrieval Consistency</span>
            <span className={`text-foreground ${colony.retrievalConsistency >= 0.7 ? "text-green-500" : "text-red-500"}`}>
              {colony.retrievalConsistency.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {retrieval && retrieval.neighbors && retrieval.neighbors.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-foreground mb-2">Retrieval Evidence</h3>
          <div className="space-y-2">
            {retrieval.neighbors.slice(0, 3).map((similar) => (
              <RetrievalEvidenceCard
                key={similar.colonyId}
                colonyId={similar.colonyId}
                similarity={similar.similarity}
                calibratedScore={similar.calibratedScore}
                domain={similar.domain}
                imageUrl=""
              />
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="text-xs font-semibold text-foreground mb-2">Recommendation</h3>
        <div className="p-2 bg-secondary rounded">
          {colony.calibratedScore >= 0.7 && colony.uncertainty.total <= 0.3 ? (
            <div className="text-xs text-green-500">Accept - High confidence, low uncertainty</div>
          ) : colony.calibratedScore >= 0.5 && colony.uncertainty.total <= 0.5 ? (
            <div className="text-xs text-amber-500">Review - Moderate confidence, requires inspection</div>
          ) : (
            <div className="text-xs text-red-500">Reject - Low confidence or high uncertainty</div>
          )}
        </div>
      </div>
    </div>
  );
}
