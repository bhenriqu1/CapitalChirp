import React from "react";

interface SectorTagProps {
  sector: string;
  className?: string;
}

export function SectorTag({ sector, className = "" }: SectorTagProps) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-purple-100 text-purple-800 border border-purple-300 ${className}`}
    >
      {sector}
    </span>
  );
}

