import React from 'react';

const LoadingSpinner: React.FC = () => {
  return (
    <div className="flex min-h-40 items-center justify-center px-4 py-8">
      <div className="text-center" aria-live="polite">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/25 bg-primary/10 shadow-[0_0_30px_rgba(255,98,21,0.12)]">
          <span className="loading loading-spinner loading-md text-primary" aria-hidden="true"></span>
        </div>
        <p className="text-sm font-medium text-base-content/80">Loading…</p>
        <p className="mt-1 text-xs text-base-content/50">Syncing live management data</p>
      </div>
    </div>
  );
};

export default LoadingSpinner; 