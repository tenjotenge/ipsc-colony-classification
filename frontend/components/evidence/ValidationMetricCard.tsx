"use client";

import React from "react";

interface ValidationMetricCardProps {
  label: string;
  value: number;
  format?: "percentage" | "decimal" | "score";
  threshold?: { min: number; max: number };
}

export const ValidationMetricCard: React.FC<ValidationMetricCardProps> = ({
  label,
  value,
  format = "decimal",
  threshold,
}) => {
  const formatValue = () => {
    if (format === "percentage") return `${(value * 100).toFixed(1)}%`;
    return value.toFixed(2);
  };

  const getColor = () => {
    if (!threshold) return "text-foreground";
    if (typeof threshold === "number") {
      return value >= threshold ? "text-green-500" : "text-red-500";
    }
    return value >= threshold.min && value <= threshold.max ? "text-green-500" : "text-red-500";
  };

  const getBarColor = () => {
    if (!threshold) return "bg-primary";
    if (typeof threshold === "number") {
      return value >= threshold ? "bg-green-500" : "bg-red-500";
    }
    return value >= threshold.min && value <= threshold.max ? "bg-green-500" : "bg-red-500";
  };

  const getThresholdDisplay = () => {
    if (!threshold) return "N/A";
    if (typeof threshold === "number") return (threshold as number).toFixed(2);
    const range = threshold as { min: number; max: number };
    return `${range.min.toFixed(2)} - ${range.max.toFixed(2)}`;
  };

  return (
    <div className="p-3 rounded border border-border bg-card hover:bg-secondary transition-colors">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-foreground">{label}</span>
        <span className={`text-xs font-semibold ${getColor()}`}>{formatValue()}</span>
      </div>
      <div className="w-full h-1.5 bg-secondary rounded overflow-hidden">
        <div
          className={`h-full ${getBarColor()}`}
          style={{ width: `${Math.min(value * 100, 100)}%` }}
        />
      </div>
      <div className="mt-1.5 text-xs text-muted-foreground">
        Threshold: {getThresholdDisplay()}
      </div>
    </div>
  );
};
