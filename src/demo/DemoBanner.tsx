/**
 * DemoBanner — subtle indicator that the viewer is in demo mode.
 * Shown at the top of the page when visiting the `/demo` route.
 */

import React from 'react';
import { getDemoUrl } from './demo-core';

const DemoBanner: React.FC = () => {
  const shareUrl = getDemoUrl();

  return (
    <div className="bg-gradient-to-r from-warning/90 via-accent/90 to-warning/90 text-warning-content">
      <div className="max-w-7xl mx-auto px-4 py-1.5 flex items-center justify-between text-xs md:text-sm">
        <div className="flex items-center gap-2">
          <span className="badge badge-warning badge-xs md:badge-sm font-bold tracking-wider uppercase">
            Demo
          </span>
          <span className="hidden sm:inline opacity-80">
            You are viewing a public demo instance with simulated data.
          </span>
          <span className="sm:hidden opacity-80">Public demo instance</span>
        </div>
        <button
          onClick={() => {
            navigator.clipboard.writeText(shareUrl).catch(() => {});
          }}
          className="btn btn-ghost btn-xs md:btn-sm text-warning-content gap-1 hover:bg-warning/20"
          title="Copy demo URL to clipboard"
        >
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
            />
          </svg>
          <span className="hidden md:inline">Share Demo</span>
        </button>
      </div>
    </div>
  );
};

export default DemoBanner;
