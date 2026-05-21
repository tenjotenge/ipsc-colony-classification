"use client";

import React, { useState } from "react";
import { useReviewWorkflowStore } from "@/lib/review/ReviewWorkflowStore";
import { useColony } from "@/lib/queries/hooks";
import { CalibratedScoreBadge } from "@/components/shared/CalibratedScoreBadge";
import { UncertaintyIndicator } from "@/components/shared/UncertaintyIndicator";

export function ValidateStage() {
  const { selectedColonyId, makeDecision, nextColony } = useReviewWorkflowStore();
  const { data: colony } = useColony(selectedColonyId || "");
  const [confidence, setConfidence] = useState(0.5);
  const [reasoning, setReasoning] = useState("");

  if (!colony) {
    return (
      <div className="p-3 border border-border bg-card">
        <div className="text-xs text-muted-foreground">No colony selected</div>
      </div>
    );
  }

  const handleAccept = () => {
    makeDecision({
      colonyId: colony.id,
      accepted: true,
      confidence,
      reasoning: reasoning || undefined,
      timestamp: Date.now(),
    });
    nextColony();
    setConfidence(0.5);
    setReasoning("");
  };

  const handleReject = () => {
    makeDecision({
      colonyId: colony.id,
      accepted: false,
      confidence,
      reasoning: reasoning || undefined,
      timestamp: Date.now(),
    });
    nextColony();
    setConfidence(0.5);
    setReasoning("");
  };

  return (
    <div className="p-3 border border-border bg-card space-y-3">
      <div>
        <h3 className="text-xs font-semibold text-foreground mb-2">Colony #{colony.id}</h3>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center gap-1">
            <CalibratedScoreBadge score={colony.calibratedScore} />
          </div>
          <div className="flex items-center gap-1">
            <UncertaintyIndicator uncertainty={colony.uncertainty.total} />
            <span className="text-xs text-foreground">{colony.uncertainty.total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-xs font-semibold text-foreground mb-2">Confidence</h3>
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={confidence}
          onChange={(e) => setConfidence(parseFloat(e.target.value))}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>0.0</span>
          <span>{confidence.toFixed(1)}</span>
          <span>1.0</span>
        </div>
      </div>

      <div>
        <h3 className="text-xs font-semibold text-foreground mb-2">Reasoning (Optional)</h3>
        <textarea
          value={reasoning}
          onChange={(e) => setReasoning(e.target.value)}
          placeholder="Add notes about your decision..."
          className="w-full px-2 py-1 text-xs border border-border rounded bg-background text-foreground resize-none"
          rows={3}
        />
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleAccept}
          className="flex-1 px-2 py-1.5 text-xs font-medium rounded border border-green-500/30 bg-green-500/10 text-green-500 hover:bg-green-500/20"
        >
          Accept
        </button>
        <button
          onClick={handleReject}
          className="flex-1 px-2 py-1.5 text-xs font-medium rounded border border-red-500/30 bg-red-500/10 text-red-500 hover:bg-red-500/20"
        >
          Reject
        </button>
      </div>
    </div>
  );
}
