import React from "react";
import Link from "next/link";

interface TickerTagProps {
  ticker: string;
  price?: number;
  changePercent?: number;
  className?: string;
  clickable?: boolean;
}

export function TickerTag({ ticker, price, changePercent, className = "", clickable = true }: TickerTagProps) {
  const isPositive = changePercent !== undefined && changePercent > 0;
  const isNegative = changePercent !== undefined && changePercent < 0;

  const content = (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200 ${className}`}>
      <span className="font-semibold text-blue-900">{ticker}</span>
      {price !== undefined && (
        <span className="text-sm text-gray-700">${price.toFixed(2)}</span>
      )}
      {changePercent !== undefined && (
        <span
          className={`text-sm font-medium ${
            isPositive ? "text-green-600" : isNegative ? "text-red-600" : "text-gray-600"
          }`}
        >
          {isPositive ? "+" : ""}
          {changePercent.toFixed(2)}%
        </span>
      )}
    </div>
  );

  if (clickable) {
    return (
      <Link href={`/ticker/${ticker}`} className="hover:opacity-80 transition-opacity">
        {content}
      </Link>
    );
  }

  return content;
}

