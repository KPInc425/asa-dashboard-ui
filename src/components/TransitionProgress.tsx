/**
 * TransitionProgress Component
 * 
 * Displays visual progress feedback during server state transitions (starting/stopping).
 * Features:
 * - Animated progress indicator
 * - Elapsed time display
 * - Expected duration countdown (when available)
 * - Warning indicator for stuck transitions
 * - Compact and expanded variants
 * 
 * Usage:
 * ```tsx
 * import TransitionProgress from '../components/TransitionProgress';
 * 
 * function ServerCard({ server }) {
 *   return (
 *     <div>
 *       <TransitionProgress
 *         status={server.status}
 *         transitionStartedAt={server.transitionStartedAt}
 *         expectedDuration={60000}
 *         variant="compact"
 *       />
 *     </div>
 *   );
 * }
 * ```
 */

import React, { useState, useEffect } from 'react';
import { ServerStatus } from '../types/serverStatus';
import { TRANSITION_THRESHOLDS } from '../hooks/useServerData';

export interface TransitionProgressProps {
  /** Current server status */
  status: ServerStatus | string;
  /** When the transition started (ISO string or Date) */
  transitionStartedAt?: string | Date;
  /** Expected duration of the transition in milliseconds */
  expectedDuration?: number;
  /** Previous status before transition */
  previousStatus?: ServerStatus | string;
  /** Display variant */
  variant?: 'compact' | 'full' | 'inline';
  /** Whether to show the elapsed time */
  showElapsedTime?: boolean;
  /** Whether to show expected duration */
  showExpectedDuration?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Callback when transition is potentially stuck */
  onStuck?: () => void;
}

/**
 * Format duration in milliseconds to human-readable string
 */
function formatDuration(ms: number): string {
  if (ms < 0) ms = 0;
  
  const seconds = Math.floor(ms / 1000) % 60;
  const minutes = Math.floor(ms / 60000) % 60;
  const hours = Math.floor(ms / 3600000);

  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
}

/**
 * Get the action label for a transition status
 */
function getTransitionLabel(status: ServerStatus | string): string {
  switch (status) {
    case ServerStatus.STARTING:
      return 'Starting';
    case ServerStatus.STOPPING:
      return 'Stopping';
    default:
      return 'Transitioning';
  }
}

/**
 * Get the icon for a transition status
 */
function getTransitionIcon(status: ServerStatus | string): string {
  switch (status) {
    case ServerStatus.STARTING:
      return '🚀';
    case ServerStatus.STOPPING:
      return '🛑';
    default:
      return '🔄';
  }
}

/**
 * Get progress color class based on progress percentage and stuck state
 */
function getProgressColor(progress: number, isStuck: boolean): string {
  if (isStuck) return 'progress-error';
  if (progress > 100) return 'progress-warning';
  if (progress > 75) return 'progress-info';
  return 'progress-primary';
}

const TransitionProgress: React.FC<TransitionProgressProps> = ({
  status,
  transitionStartedAt,
  expectedDuration,
  previousStatus,
  variant = 'full',
  showElapsedTime = true,
  showExpectedDuration = true,
  className = '',
  onStuck,
}) => {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isStuck, setIsStuck] = useState(false);

  // Check if server is in a transition state
  const isTransitioning = 
    status === ServerStatus.STARTING || 
    status === ServerStatus.STOPPING;

  // Calculate elapsed time
  useEffect(() => {
    if (!isTransitioning || !transitionStartedAt) {
      setElapsedTime(0);
      setIsStuck(false);
      return;
    }

    const startTime = typeof transitionStartedAt === 'string' 
      ? new Date(transitionStartedAt).getTime() 
      : transitionStartedAt.getTime();

    const updateElapsed = () => {
      const elapsed = Date.now() - startTime;
      setElapsedTime(elapsed);

      // Check if stuck
      if (elapsed > TRANSITION_THRESHOLDS.STUCK_THRESHOLD && !isStuck) {
        setIsStuck(true);
        onStuck?.();
      }
    };

    // Update immediately
    updateElapsed();

    // Update every second
    const intervalId = setInterval(updateElapsed, 1000);

    return () => clearInterval(intervalId);
  }, [isTransitioning, transitionStartedAt, isStuck, onStuck]);

  // Don't render if not transitioning
  if (!isTransitioning) {
    return null;
  }

  // Calculate progress percentage
  const progressPercent = expectedDuration 
    ? Math.min((elapsedTime / expectedDuration) * 100, 150) 
    : undefined;

  const remainingTime = expectedDuration ? expectedDuration - elapsedTime : undefined;
  const isOvertime = remainingTime !== undefined && remainingTime < 0;

  // Compact inline variant
  if (variant === 'inline') {
    return (
      <span className={`inline-flex items-center gap-1.5 text-sm ${className}`}>
        <span className="loading loading-spinner loading-xs"></span>
        <span>{getTransitionLabel(status)}</span>
        {showElapsedTime && (
          <span className="text-base-content/60">({formatDuration(elapsedTime)})</span>
        )}
        {isStuck && (
          <span className="text-warning" title="Taking longer than expected">⚠️</span>
        )}
      </span>
    );
  }

  // Compact variant for cards
  if (variant === 'compact') {
    return (
      <div className={`flex flex-col gap-1 ${className}`}>
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1.5">
            <span className="loading loading-spinner loading-xs"></span>
            <span>{getTransitionLabel(status)}</span>
          </div>
          {showElapsedTime && (
            <span className={`text-xs ${isStuck ? 'text-warning' : 'text-base-content/60'}`}>
              {formatDuration(elapsedTime)}
              {isStuck && ' ⚠️'}
            </span>
          )}
        </div>
        {expectedDuration && (
          <progress 
            className={`progress ${getProgressColor(progressPercent || 0, isStuck)} w-full h-1.5`}
            value={progressPercent}
            max="100"
          />
        )}
      </div>
    );
  }

  // Full variant with all details
  return (
    <div className={`card bg-base-200 ${className}`}>
      <div className="card-body p-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{getTransitionIcon(status)}</span>
            <div>
              <h4 className="font-semibold">{getTransitionLabel(status)} Server</h4>
              {previousStatus && (
                <p className="text-xs text-base-content/60">
                  From: {previousStatus}
                </p>
              )}
            </div>
          </div>
          <div className="loading loading-spinner loading-md text-primary"></div>
        </div>

        {/* Progress bar */}
        {expectedDuration && (
          <div className="mt-3">
            <progress 
              className={`progress ${getProgressColor(progressPercent || 0, isStuck)} w-full h-2`}
              value={progressPercent}
              max="100"
            />
          </div>
        )}

        {/* Time information */}
        <div className="flex justify-between items-center mt-2 text-sm">
          {showElapsedTime && (
            <div>
              <span className="text-base-content/70">Elapsed: </span>
              <span className={`font-medium ${isStuck ? 'text-warning' : ''}`}>
                {formatDuration(elapsedTime)}
              </span>
            </div>
          )}
          
          {showExpectedDuration && expectedDuration && remainingTime !== undefined && (
            <div>
              {isOvertime ? (
                <>
                  <span className="text-warning/70">Overtime: </span>
                  <span className="font-medium text-warning">
                    +{formatDuration(Math.abs(remainingTime))}
                  </span>
                </>
              ) : (
                <>
                  <span className="text-base-content/70">Remaining: </span>
                  <span className="font-medium">~{formatDuration(remainingTime)}</span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Stuck warning */}
        {isStuck && (
          <div className="alert alert-warning mt-3 py-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-5 w-5" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div className="text-sm">
              <span className="font-medium">Transition taking longer than expected</span>
              <p className="text-xs opacity-80">
                The server may need attention. Check logs for more details.
              </p>
            </div>
          </div>
        )}

        {/* Expected duration info */}
        {expectedDuration && !isStuck && (
          <div className="text-xs text-base-content/50 mt-1">
            Typical duration: ~{formatDuration(expectedDuration)}
          </div>
        )}
      </div>
    </div>
  );
};

export default TransitionProgress;
