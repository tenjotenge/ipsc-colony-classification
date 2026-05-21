"use client";

import React from "react";
import { ReviewStage, useReviewWorkflowStore } from "@/lib/review/ReviewWorkflowStore";

export function ReviewWorkflowControls() {
  const { currentStage, setStage, nextColony, previousColony, endReview, reviewQueue, currentIndex, isReviewing } = useReviewWorkflowStore();

  if (!isReviewing) return null;

  const stages: { key: ReviewStage; label: string; shortcut: string }[] = [
    { key: ReviewStage.Scan, label: "Scan", shortcut: "1" },
    { key: ReviewStage.Inspect, label: "Inspect", shortcut: "2" },
    { key: ReviewStage.Compare, label: "Compare", shortcut: "3" },
    { key: ReviewStage.Evaluate, label: "Evaluate", shortcut: "4" },
    { key: ReviewStage.Validate, label: "Validate", shortcut: "5" },
  ];

  return (
    <div className="p-3 border border-border bg-card">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-foreground">
          Review Progress: {currentIndex + 1} / {reviewQueue.length}
        </span>
        <button
          onClick={endReview}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          End Review
        </button>
      </div>

      {/* Stage navigation */}
      <div className="flex gap-1 mb-2">
        {stages.map((stage) => (
          <button
            key={stage.key}
            onClick={() => setStage(stage.key)}
            className={`flex-1 px-2 py-1 text-xs font-medium rounded border transition-colors ${
              currentStage === stage.key
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-secondary text-muted-foreground border-border hover:text-foreground"
            }`}
          >
            <span className="block text-center">{stage.label}</span>
            <span className="block text-[10px] opacity-70">[{stage.shortcut}]</span>
          </button>
        ))}
      </div>

      {/* Colony navigation */}
      <div className="flex gap-1">
        <button
          onClick={previousColony}
          disabled={currentIndex === 0}
          className="flex-1 px-2 py-1 text-xs font-medium rounded border border-border bg-secondary text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        <button
          onClick={nextColony}
          disabled={currentIndex === reviewQueue.length - 1}
          className="flex-1 px-2 py-1 text-xs font-medium rounded border border-border bg-secondary text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    </div>
  );
}
