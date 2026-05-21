"use client";

import React from "react";
import { ReviewStage, useReviewWorkflowStore } from "@/lib/review/ReviewWorkflowStore";
import { ReviewWorkflowControls } from "./ReviewWorkflowControls";
import { ScanStage, InspectStage, CompareStage, EvaluateStage, ValidateStage } from "./stages";

export function ReviewWorkflowPanel() {
  const { currentStage } = useReviewWorkflowStore();

  const renderStage = () => {
    switch (currentStage) {
      case ReviewStage.Scan:
        return <ScanStage />;
      case ReviewStage.Inspect:
        return <InspectStage />;
      case ReviewStage.Compare:
        return <CompareStage />;
      case ReviewStage.Evaluate:
        return <EvaluateStage />;
      case ReviewStage.Validate:
        return <ValidateStage />;
      default:
        return <ScanStage />;
    }
  };

  return (
    <div className="space-y-2">
      <ReviewWorkflowControls />
      {renderStage()}
    </div>
  );
}
