/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Loader2 } from 'lucide-react';

export const PageSkeleton: React.FC = () => {
  return (
    <div className="w-full max-w-6xl mx-auto py-8 px-4 space-y-6">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-8 w-48 rounded-xl border border-[var(--border)] animate-shimmer" />
          <div className="h-4 w-72 rounded-lg border border-[var(--border)] animate-shimmer opacity-80" />
        </div>
        <div className="flex items-center gap-2 text-xs text-[var(--accent)] font-semibold px-3 py-1.5 rounded-full bg-[var(--surface-secondary)] border border-[var(--border)]">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--accent)]" />
          <span>Loading module...</span>
        </div>
      </div>

      {/* Main card skeleton */}
      <div className="pak-card p-6 space-y-5">
        <div className="h-11 w-full rounded-xl border border-[var(--border)] animate-shimmer" />
        <div className="space-y-2.5 pt-2">
          <div className="h-4 w-3/4 rounded-md border border-[var(--border)] animate-shimmer opacity-90" />
          <div className="h-4 w-5/6 rounded-md border border-[var(--border)] animate-shimmer opacity-70" />
          <div className="h-4 w-2/3 rounded-md border border-[var(--border)] animate-shimmer opacity-60" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
          <div className="h-24 rounded-xl border border-[var(--border)] animate-shimmer" />
          <div className="h-24 rounded-xl border border-[var(--border)] animate-shimmer" />
          <div className="h-24 rounded-xl border border-[var(--border)] animate-shimmer" />
        </div>
      </div>
    </div>
  );
};
