import React from 'react';

export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse bg-slate-800/80 rounded ${className}`}
    />
  );
}

export function TableSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="w-full space-y-3">
      <div className="h-10 bg-slate-800/60 rounded-lg animate-pulse" />
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex space-x-3">
          {Array.from({ length: cols }).map((_, c) => (
            <div key={c} className="h-10 bg-slate-900/80 border border-slate-800/40 rounded flex-1 animate-pulse" />
          ))}
        </div>
      ))}
    </div>
  );
}
