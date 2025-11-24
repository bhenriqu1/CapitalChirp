import React from "react";

interface SentimentChipProps {
  sentiment: "bullish" | "bearish" | "neutral";
  className?: string;
}

export function SentimentChip({ sentiment, className = "" }: SentimentChipProps) {
  const styles = {
    bullish: "bg-green-100 text-green-800 border-green-300",
    bearish: "bg-red-100 text-red-800 border-red-300",
    neutral: "bg-gray-100 text-gray-800 border-gray-300",
  };

  const icons = {
    bullish: "📈",
    bearish: "📉",
    neutral: "➡️",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${styles[sentiment]} ${className}`}
    >
      <span>{icons[sentiment]}</span>
      <span className="capitalize">{sentiment}</span>
    </span>
  );
}

