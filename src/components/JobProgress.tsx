/**
 * JobProgress Component
 *
 * A daisyUI progress indicator for long-running actions that report
 * progress (0-100%). Displays a progress bar with status text and
 * an optional message below it.
 *
 * Usage:
 * ```tsx
 * <JobProgress progress={65} status="running" message="Backing up data..." />
 * ```
 *
 * @see /home/steam/automation/docs/plans/phase7-auth-commands-design.md
 */

import React from 'react';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface JobProgressProps {
  /** Progress percentage (0-100) */
  progress: number;
  /** Current status of the job */
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  /** Human-readable message describing the current operation */
  message?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Map a job status to a daisyUI progress bar colour class.
 */
function getProgressColor(status: JobProgressProps['status']): string {
  switch (status) {
    case 'completed':
      return 'progress-success';
    case 'failed':
      return 'progress-error';
    case 'cancelled':
      return 'progress-warning';
    case 'running':
      return 'progress-info';
    case 'pending':
    default:
      return 'progress-primary';
  }
}

/**
 * Map a job status to a status text label.
 */
function getStatusLabel(status: JobProgressProps['status']): string {
  switch (status) {
    case 'pending':
      return 'Pending...';
    case 'running':
      return 'In Progress';
    case 'completed':
      return 'Completed';
    case 'failed':
      return 'Failed';
    case 'cancelled':
      return 'Cancelled';
  }
}

/**
 * Clamp progress between 0 and 100 for display.
 */
function clampProgress(value: number): number {
  return Math.max(0, Math.min(100, value));
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const JobProgress: React.FC<JobProgressProps> = ({ progress, status, message }) => {
  const colorClass = getProgressColor(status);
  const statusLabel = getStatusLabel(status);
  const clamped = clampProgress(progress);
  const isIndeterminate = status === 'pending' || (status === 'running' && clamped === 0);

  return (
    <div className="w-full space-y-2" role="progressbar" aria-valuenow={clamped} aria-valuemin={0} aria-valuemax={100}>
      {/* Progress bar */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          {isIndeterminate ? (
            <progress className={`progress ${colorClass} w-full`} />
          ) : (
            <progress
              className={`progress ${colorClass} w-full`}
              value={clamped}
              max={100}
            />
          )}
        </div>
        <span className="text-sm font-mono text-base-content/70 tabular-nums min-w-[3ch] text-right">
          {isIndeterminate ? '--' : `${Math.round(clamped)}%`}
        </span>
      </div>

      {/* Status row */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          {status === 'running' && (
            <span className="loading loading-spinner loading-xs text-info"></span>
          )}
          {status === 'failed' && (
            <span className="text-error" aria-label="Failed">✗</span>
          )}
          {status === 'completed' && (
            <span className="text-success" aria-label="Completed">✓</span>
          )}
          <span className="font-medium text-base-content/80">{statusLabel}</span>
        </div>
      </div>

      {/* Message */}
      {message && (
        <p className="text-sm text-base-content/60">{message}</p>
      )}
    </div>
  );
};

export default JobProgress;
