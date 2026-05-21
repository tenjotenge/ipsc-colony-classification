"use client";

import React from "react";

interface ConsensusBreakdownProps {
  calibratedScoreWeight: number;
  perturbationStabilityWeight: number;
  entropyWeight: number;
  retrievalConsistencyWeight: number;
  domainAgreementWeight: number;
}

export const ConsensusBreakdown: React.FC<ConsensusBreakdownProps> = ({
  calibratedScoreWeight,
  perturbationStabilityWeight,
  entropyWeight,
  retrievalConsistencyWeight,
  domainAgreementWeight,
}) => {
  const metrics = [
    { label: "Calibrated Score", value: calibratedScoreWeight },
    { label: "Perturbation Stability", value: perturbationStabilityWeight },
    { label: "Entropy", value: entropyWeight },
    { label: "Retrieval Consistency", value: retrievalConsistencyWeight },
    { label: "Domain Agreement", value: domainAgreementWeight },
  ];

  return (
    <div className="p-3 rounded border border-border bg-card">
      <h3 className="text-xs font-semibold text-foreground mb-3">Consensus Weights</h3>
      <div className="space-y-2">
        {metrics.map((weight, index: number) => (
          <div key={index} className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{weight.label}</span>
              <span className="text-xs font-medium text-foreground">{(weight.value * 100).toFixed(1)}%</span>
            </div>
            <div className="w-full h-1.5 bg-secondary rounded overflow-hidden">
              <div
                className="h-full bg-primary"
                style={{ width: `${weight.value * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
