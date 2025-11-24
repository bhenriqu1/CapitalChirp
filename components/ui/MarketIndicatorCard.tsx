import React from "react";
import { TickerTag } from "./TickerTag";

interface MarketIndicatorCardProps {
  ticker: string;
  price: number;
  changePercent: number;
  volume: number;
  postCount?: number;
  className?: string;
}

export function MarketIndicatorCard({
  ticker,
  price,
  changePercent,
  volume,
  postCount,
  className = "",
}: MarketIndicatorCardProps) {
  const isPositive = changePercent > 0;
  const volumeFormatted = volume >= 1e9 ? `${(volume / 1e9).toFixed(2)}B` : volume >= 1e6 ? `${(volume / 1e6).toFixed(2)}M` : volume.toLocaleString();

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-4 shadow-sm ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <TickerTag ticker={ticker} price={price} changePercent={changePercent} clickable={false} />
        {postCount !== undefined && (
          <span className="text-xs text-gray-500">{postCount} posts</span>
        )}
      </div>
      <div className="flex items-center justify-between text-sm">
        <div>
          <span className="text-gray-600">Volume: </span>
          <span className="font-medium text-gray-900">{volumeFormatted}</span>
        </div>
        <div className={`text-xs font-medium ${isPositive ? "text-green-600" : "text-red-600"}`}>
          {isPositive ? "↑" : "↓"} Trending
        </div>
      </div>
    </div>
  );
}

