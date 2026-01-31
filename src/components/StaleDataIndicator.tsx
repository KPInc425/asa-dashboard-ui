/**
 * StaleDataIndicator Component
 * 
 * Displays a visual indicator when server data is stale or status is unknown.
 * Provides context about why data might be outdated and offers a refresh action.
 * 
 * Features:
 * - Visual distinction with warning styling
 * - Reason display from backend
 * - Optional refresh button
 * - Compact and full variants
 * - Theme-aware styling
 * 
 * Usage:
 * ```tsx
 * import StaleDataIndicator from '../components/StaleDataIndicator';
 * 
 * function ServerStatus({ data }) {
 *   const isStale = isDataStale(data);
 *   
 *   return (
 *     <div>
 *       <StatusBadge status={data.status} />
 *       {isStale && (
 *         <StaleDataIndicator
 *           reason={data.reason}
 *           lastUpdated={data.updatedAt}
 *           onRefresh={() => refetch()}
 *         />
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */

import React from 'react';
import { ServerStatus, isDataStale, type ServerLiveData } from '../types/serverStatus';

export interface StaleDataIndicatorProps {
  /** Reason for the stale/unknown state */
  reason?: string;
  /** When the data was last updated (ISO string or Date) */
  lastUpdated?: string | Date;
  /** Callback when refresh is requested */
  onRefresh?: () => void;
  /** Whether a refresh is in progress */
  isRefreshing?: boolean;
  /** Display variant */
  variant?: 'compact' | 'full' | 'inline' | 'badge';
  /** Server status for context */
  status?: ServerStatus | string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Format the time since last update
 */
function formatTimeSince(date: string | Date | undefined): string {
  if (!date) return 'Unknown';
  
  const updateTime = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - updateTime.getTime();
  
  if (diffMs < 0) return 'Just now';
  
  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ago`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s ago`;
  }
  return `${seconds}s ago`;
}

/**
 * Get icon based on reason type
 */
function getReasonIcon(reason?: string): string {
  if (!reason) return '⚠️';
  
  const reasonLower = reason.toLowerCase();
  
  if (reasonLower.includes('timeout')) return '⏱️';
  if (reasonLower.includes('connection') || reasonLower.includes('network')) return '🔌';
  if (reasonLower.includes('rcon')) return '🔧';
  if (reasonLower.includes('auth')) return '🔒';
  if (reasonLower.includes('offline')) return '📴';
  
  return '⚠️';
}

/**
 * Get a user-friendly message from the reason
 */
function getUserFriendlyReason(reason?: string): string {
  if (!reason) return 'Data may be outdated';
  
  const reasonLower = reason.toLowerCase();
  
  if (reasonLower.includes('timeout')) {
    return 'Connection timed out';
  }
  if (reasonLower.includes('rcon')) {
    return 'RCON connection failed';
  }
  if (reasonLower.includes('connection refused')) {
    return 'Server not responding';
  }
  if (reasonLower.includes('auth')) {
    return 'Authentication failed';
  }
  
  // Truncate long reasons
  if (reason.length > 60) {
    return reason.substring(0, 57) + '...';
  }
  
  return reason;
}

const StaleDataIndicator: React.FC<StaleDataIndicatorProps> = ({
  reason,
  lastUpdated,
  onRefresh,
  isRefreshing = false,
  variant = 'compact',
  status,
  className = '',
}) => {
  const icon = getReasonIcon(reason);
  const friendlyReason = getUserFriendlyReason(reason);
  const timeSince = formatTimeSince(lastUpdated);
  
  // Badge variant - minimal inline indicator
  if (variant === 'badge') {
    return (
      <span
        className={`badge badge-warning badge-outline gap-1 ${className}`}
        title={`${friendlyReason}\nLast updated: ${timeSince}`}
      >
        {icon} Stale
      </span>
    );
  }
  
  // Inline variant - single line with optional refresh
  if (variant === 'inline') {
    return (
      <span className={`inline-flex items-center gap-1.5 text-warning text-sm ${className}`}>
        <span>{icon}</span>
        <span className="opacity-80">{friendlyReason}</span>
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="btn btn-ghost btn-xs"
            aria-label="Refresh data"
          >
            {isRefreshing ? (
              <span className="loading loading-spinner loading-xs"></span>
            ) : (
              '🔄'
            )}
          </button>
        )}
      </span>
    );
  }
  
  // Compact variant - small box with essential info
  if (variant === 'compact') {
    return (
      <div
        className={`
          flex items-center justify-between gap-2 p-2 rounded
          bg-warning/10 border border-warning/30
          text-sm
          ${className}
        `}
      >
        <div className="flex items-center gap-1.5 text-warning min-w-0">
          <span className="flex-shrink-0">{icon}</span>
          <span className="truncate opacity-90">{friendlyReason}</span>
        </div>
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="btn btn-ghost btn-xs flex-shrink-0"
            aria-label="Refresh data"
          >
            {isRefreshing ? (
              <span className="loading loading-spinner loading-xs"></span>
            ) : (
              '🔄 Refresh'
            )}
          </button>
        )}
      </div>
    );
  }
  
  // Full variant - detailed card with all information
  return (
    <div
      className={`
        card bg-warning/10 border border-warning/30
        ${className}
      `}
    >
      <div className="card-body p-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{icon}</span>
            <div>
              <h4 className="font-semibold text-warning">Data May Be Stale</h4>
              <p className="text-sm text-base-content/70">
                {status === ServerStatus.UNKNOWN
                  ? 'Unable to determine server status'
                  : 'Showing cached or outdated information'}
              </p>
            </div>
          </div>
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="btn btn-warning btn-sm"
              aria-label="Refresh data"
            >
              {isRefreshing ? (
                <>
                  <span className="loading loading-spinner loading-xs"></span>
                  <span>Refreshing...</span>
                </>
              ) : (
                <>
                  <span>🔄</span>
                  <span>Refresh</span>
                </>
              )}
            </button>
          )}
        </div>
        
        {/* Details */}
        <div className="mt-3 space-y-1 text-sm">
          {reason && (
            <div className="flex items-start gap-2">
              <span className="text-base-content/60 flex-shrink-0">Reason:</span>
              <span className="text-base-content/80">{friendlyReason}</span>
            </div>
          )}
          {lastUpdated && (
            <div className="flex items-center gap-2">
              <span className="text-base-content/60">Last updated:</span>
              <span className="text-base-content/80">{timeSince}</span>
            </div>
          )}
        </div>
        
        {/* Hint */}
        <div className="mt-3 text-xs text-base-content/50">
          <p>
            The server may be starting up, experiencing network issues, or temporarily unavailable.
            Try refreshing or check the server logs for more information.
          </p>
        </div>
      </div>
    </div>
  );
};

/**
 * Utility component to check if data should show stale indicator
 */
export function shouldShowStaleIndicator(
  data: ServerLiveData | null,
  status?: ServerStatus | string
): boolean {
  if (!data) return false;
  
  // Show for unknown status
  if (status === ServerStatus.UNKNOWN || data.status === ServerStatus.UNKNOWN) {
    return true;
  }
  
  // Show if data is marked as stale
  if (isDataStale(data)) {
    return true;
  }
  
  // Show if there's a reason indicating an issue
  if (data.reason && (
    data.reason.toLowerCase().includes('timeout') ||
    data.reason.toLowerCase().includes('error') ||
    data.reason.toLowerCase().includes('failed')
  )) {
    return true;
  }
  
  return false;
}

export default StaleDataIndicator;
