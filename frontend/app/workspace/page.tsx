"use client";

import React from "react";

import { WorkspaceShell } from "@/components/workspace/WorkspaceShell";
import { MicroscopyViewer } from "@/components/viewer/MicroscopyViewer";
import { ReviewWorkflowPanel } from "@/components/review";
import { useWorkspace } from "@/lib/workspace";
import { useReviewWorkflowStore } from "@/lib/review/ReviewWorkflowStore";

export default function WorkspacePage() {
  const { mode } = useWorkspace();
  const { startReview, isReviewing } = useReviewWorkflowStore();

  // Mock image URL - replace with actual backend URL
  const mockImageUrl = "https://via.placeholder.com/2000x2000.png";

  const handleStartReview = () => {
    // Mock queue - replace with actual colony IDs from analysis
    const mockQueue = ["colony-1", "colony-2", "colony-3", "colony-4", "colony-5"];
    startReview(mockQueue);
  };

  return (
    <WorkspaceShell
      leftPanel={
        <div className="p-3 space-y-3">
          {isReviewing ? (
            <ReviewWorkflowPanel />
          ) : (
            <>
              <div>
                <h2 className="text-xs font-semibold mb-2 text-foreground">
                  Controls
                </h2>
                <p className="text-xs text-muted-foreground">
                  Mode-specific controls will appear here.
                </p>
              </div>
              <div className="p-2 bg-secondary rounded border border-border">
                <div className="font-mono text-[10px] text-muted-foreground mb-1">Current Mode</div>
                <div className="text-xs font-medium text-foreground capitalize">{mode}</div>
              </div>
              <button
                onClick={handleStartReview}
                className="w-full px-2 py-1.5 text-xs font-medium rounded border border-border bg-secondary text-foreground hover:bg-secondary/80"
              >
                Start Review
              </button>
              <div className="p-2 bg-secondary rounded border border-border">
                <div className="font-mono text-[10px] text-muted-foreground mb-1">Keyboard Shortcuts</div>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <div><span className="font-mono text-foreground">1</span> Toggle colony boxes</div>
                  <div><span className="font-mono text-foreground">2</span> Toggle heatmap</div>
                  <div><span className="font-mono text-foreground">3</span> Toggle uncertainty</div>
                </div>
              </div>
            </>
          )}
        </div>
      }
      rightPanel={
        <div className="p-4 space-y-4">
          <div>
            <h2 className="text-sm font-semibold mb-3 text-foreground">
              Evidence
            </h2>
            <p className="text-xs text-muted-foreground">
              Colony evidence and metrics will appear here.
            </p>
          </div>
          <div className="p-3 bg-secondary/30 rounded-xl border border-border/50">
            <div className="font-mono text-xs text-muted-foreground mb-2">
              Calibrated Score
            </div>
            <div className="text-lg font-mono font-medium text-confidence-high">0.85</div>
          </div>
          <div className="p-3 bg-secondary/30 rounded-xl border border-border/50">
            <div className="font-mono text-xs text-muted-foreground mb-2">
              Uncertainty
            </div>
            <div className="text-lg font-mono font-medium text-uncertainty-low">0.23</div>
          </div>
        </div>
      }
    >
      <MicroscopyViewer imageUrl={mockImageUrl} />
    </WorkspaceShell>
  );
}
