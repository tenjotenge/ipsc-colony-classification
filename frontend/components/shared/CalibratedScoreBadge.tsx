"use client";

import React from "react";

interface CalibratedScoreBadgeProps {
  score: number;
  size?: "sm" | "md" | "lg";
}

export const CalibratedScoreBadge: React.FC<CalibratedScoreBadgeProps> = ({
  score,
  size = "md",
}) => {
  const sizeClasses: Record<string, string> = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-2.5 py-1",
    lg: "text-base px-3 py-1.5",
  };

  const getColor = () => {
    if (score >= 0.8) return "bg-green-500/10 text-green-500 border-green-500/30";
    if (score >= 0.5) return "bg-amber-500/10 text-amber-500 border-amber-500/30";
    return "bg-red-500/10 text-red-500 border-red-500/30";
  };

  return (
    <div className={`px-1.5 py-0.5 rounded border text-xs font-medium ${getColor()}`}>
      {score.toFixed(2)}
    </div>
  );
};
