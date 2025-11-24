import React from "react";

interface TrendChartProps {
  data: Array<{ date: string; value: number }>;
  className?: string;
}

export function TrendChart({ data, className = "" }: TrendChartProps) {
  if (data.length === 0) {
    return (
      <div className={`h-32 bg-gray-50 rounded-lg flex items-center justify-center ${className}`}>
        <span className="text-sm text-gray-400">No data available</span>
      </div>
    );
  }

  const maxValue = Math.max(...data.map((d) => d.value));
  const minValue = Math.min(...data.map((d) => d.value));
  const range = maxValue - minValue || 1;

  return (
    <div className={`bg-gray-50 rounded-lg p-4 ${className}`}>
      <svg viewBox="0 0 400 100" className="w-full h-32">
        <polyline
          fill="none"
          stroke="#3b82f6"
          strokeWidth="2"
          points={data
            .map(
              (d, i) =>
                `${(i / (data.length - 1 || 1)) * 380 + 10},${90 - ((d.value - minValue) / range) * 70}`
            )
            .join(" ")}
        />
      </svg>
    </div>
  );
}

