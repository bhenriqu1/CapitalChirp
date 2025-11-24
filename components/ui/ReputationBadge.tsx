import React from "react";

interface ReputationBadgeProps {
  score: number;
  className?: string;
}

export function ReputationBadge({ score, className = "" }: ReputationBadgeProps) {
  const getColor = (score: number) => {
    if (score >= 80) return "text-green-600 bg-green-50 border-green-200";
    if (score >= 60) return "text-blue-600 bg-blue-50 border-blue-200";
    if (score >= 40) return "text-yellow-600 bg-yellow-50 border-yellow-200";
    return "text-gray-600 bg-gray-50 border-gray-200";
  };

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border ${getColor(score)} ${className}`}
    >
      <span>⭐</span>
      <span>{score.toFixed(0)}</span>
    </div>
  );
}

