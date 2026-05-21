"use client";

import React from "react";

interface UncertaintyIndicatorProps {
  uncertainty: number;
  size?: "sm" | "md" | "lg";
}

export const UncertaintyIndicator: React.FC<UncertaintyIndicatorProps> = ({
  uncertainty,
  size = "md",
}) => {
  const sizeClasses: Record<string, string> = {
    sm: "w-2 h-2",
    md: "w-3 h-3",
    lg: "w-4 h-4",
  };

  const getColor = () => {
    if (uncertainty >= 0.7) return "bg-pink-500";
    if (uncertainty >= 0.4) return "bg-purple-500";
    return "bg-blue-500";
  };

  return (
    <div
      className={`w-1.5 h-1.5 rounded-full ${getColor()}`}
      title={`Uncertainty: ${uncertainty.toFixed(2)}`}
    />
  );
};
