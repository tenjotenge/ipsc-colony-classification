"use client";

import React from "react";
import { CalibratedScoreBadge } from "../shared/CalibratedScoreBadge";

interface RetrievalEvidenceCardProps {
  colonyId: string;
  similarity: number;
  calibratedScore: number;
  domain: string;
  imageUrl?: string;
}

export const RetrievalEvidenceCard: React.FC<RetrievalEvidenceCardProps> = ({
  colonyId,
  similarity,
  calibratedScore,
  domain,
  imageUrl,
}) => {
  return (
    <div className="p-3 rounded border border-border bg-card hover:bg-secondary transition-colors">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
          <span className="text-xs text-muted-foreground">Retrieval</span>
        </div>
        <span className="text-xs text-muted-foreground">#{colonyId}</span>
      </div>
      
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Similarity</span>
          <span className="text-xs font-medium text-foreground">{similarity.toFixed(2)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Calibrated Score</span>
          <CalibratedScoreBadge score={calibratedScore} />
        </div>
      </div>
    </div>
  );
};
