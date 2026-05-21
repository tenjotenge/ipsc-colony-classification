"use client";

import React from "react";
import { useReviewWorkflowStore } from "@/lib/review/ReviewWorkflowStore";
import { useColony } from "@/lib/queries/hooks";
import { CalibratedScoreBadge } from "@/components/shared/CalibratedScoreBadge";
import { UncertaintyIndicator } from "@/components/shared/UncertaintyIndicator";

export function CompareStage() {
  const { selectedColonyId, comparisonColonyIds, addComparisonColony, removeComparisonColony } = useReviewWorkflowStore();
  const { data: selectedColony } = useColony(selectedColonyId || "");

  if (!selectedColony) {
    return (
      <div className="p-3 border border-border bg-card">
        <div className="text-xs text-muted-foreground">No colony selected</div>
      </div>
    );
  }

  return (
    <div className="p-3 border border-border bg-card space-y-3">
      <div>
        <h3 className="text-xs font-semibold text-foreground mb-2">Selected Colony</h3>
        <div className="p-2 bg-secondary rounded space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">ID</span>
            <span className="text-foreground">{selectedColony.id}</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-muted-foreground">Score</span>
            <CalibratedScoreBadge score={selectedColony.calibratedScore} />
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-muted-foreground">Uncertainty</span>
            <div className="flex items-center gap-1">
              <UncertaintyIndicator uncertainty={selectedColony.uncertainty.total} />
              <span className="text-foreground">{selectedColony.uncertainty.total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-xs font-semibold text-foreground mb-2">Comparison Colonies</h3>
        {comparisonColonyIds.length === 0 ? (
          <div className="text-xs text-muted-foreground">No comparison colonies selected</div>
        ) : (
          <div className="space-y-2">
            {comparisonColonyIds.map((id) => (
              <ComparisonColonyCard
                key={id}
                colonyId={id}
                onRemove={() => removeComparisonColony(id)}
              />
            ))}
          </div>
        )}
      </div>

      <div>
        <h3 className="text-xs font-semibold text-foreground mb-2">Add Comparison</h3>
        <div className="flex gap-1">
          <input
            type="text"
            placeholder="Colony ID"
            className="flex-1 px-2 py-1 text-xs border border-border rounded bg-background text-foreground"
          />
          <button
            onClick={() => {
              const input = document.querySelector('input[placeholder="Colony ID"]') as HTMLInputElement;
              if (input?.value) {
                addComparisonColony(input.value);
                input.value = "";
              }
            }}
            className="px-2 py-1 text-xs font-medium rounded border border-border bg-secondary text-foreground hover:bg-secondary/80"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}

function ComparisonColonyCard({ colonyId, onRemove }: { colonyId: string; onRemove: () => void }) {
  const { data: colony } = useColony(colonyId);

  if (!colony) {
    return (
      <div className="p-2 bg-secondary rounded">
        <div className="text-xs text-muted-foreground">Loading colony {colonyId}...</div>
      </div>
    );
  }

  return (
    <div className="p-2 bg-secondary rounded space-y-1">
      <div className="flex justify-between items-center">
        <span className="text-xs text-foreground">{colony.id}</span>
        <button
          onClick={onRemove}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          ×
        </button>
      </div>
      <div className="flex justify-between items-center text-xs">
        <span className="text-muted-foreground">Score</span>
        <CalibratedScoreBadge score={colony.calibratedScore} />
      </div>
      <div className="flex justify-between items-center text-xs">
        <span className="text-muted-foreground">Uncertainty</span>
        <div className="flex items-center gap-1">
          <UncertaintyIndicator uncertainty={colony.uncertainty.total} />
          <span className="text-foreground">{colony.uncertainty.total.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}
