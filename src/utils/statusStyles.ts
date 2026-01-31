/**
 * Status Styling Utilities
 * 
 * Provides consistent status styling tokens across the application.
 * Uses DaisyUI semantic color classes for proper theme integration.
 * 
 * Usage:
 * ```tsx
 * import { getStatusStyle, getStatusIcon, getStatusLabel } from '../utils/statusStyles';
 * 
 * function StatusBadge({ status }: { status: ServerStatus }) {
 *   const style = getStatusStyle(status);
 *   return (
 *     <span className={`badge ${style.badgeClass}`}>
 *       {style.icon} {getStatusLabel(status)}
 *     </span>
 *   );
 * }
 * ```
 */

import { ServerStatus } from '../types/serverStatus';

/**
 * Status color configuration
 */
export interface StatusColorConfig {
  /** Background color class for light mode */
  bg: string;
  /** Text color class for light mode */
  text: string;
  /** Background color class for dark mode (DaisyUI handles this) */
  darkBg: string;
  /** Text color class for dark mode (DaisyUI handles this) */
  darkText: string;
  /** Optional pattern for visual distinction */
  pattern?: 'striped' | 'dotted';
}

/**
 * Status style configuration including badge classes and icons
 */
export interface StatusStyle {
  /** DaisyUI badge class */
  badgeClass: string;
  /** Text color class */
  textClass: string;
  /** Background color class for cards/containers */
  bgClass: string;
  /** Border color class */
  borderClass: string;
  /** Status icon emoji */
  icon: string;
  /** Whether to animate (pulse/spinner) */
  animate: boolean;
  /** Optional pattern for visual distinction */
  pattern?: 'striped' | 'dotted';
}

/**
 * Status colors mapped to DaisyUI semantic classes
 * These automatically respect light/dark theme
 */
export const STATUS_COLORS: Record<ServerStatus, StatusColorConfig> = {
  [ServerStatus.RUNNING]: {
    bg: 'bg-success/20',
    text: 'text-success',
    darkBg: 'bg-success/20',
    darkText: 'text-success',
  },
  [ServerStatus.STOPPED]: {
    bg: 'bg-base-300',
    text: 'text-base-content/70',
    darkBg: 'bg-base-300',
    darkText: 'text-base-content/70',
  },
  [ServerStatus.STARTING]: {
    bg: 'bg-info/20',
    text: 'text-info',
    darkBg: 'bg-info/20',
    darkText: 'text-info',
  },
  [ServerStatus.STOPPING]: {
    bg: 'bg-warning/20',
    text: 'text-warning',
    darkBg: 'bg-warning/20',
    darkText: 'text-warning',
  },
  [ServerStatus.FAILED]: {
    bg: 'bg-error/20',
    text: 'text-error',
    darkBg: 'bg-error/20',
    darkText: 'text-error',
  },
  [ServerStatus.UNKNOWN]: {
    bg: 'bg-warning/10',
    text: 'text-warning',
    darkBg: 'bg-warning/10',
    darkText: 'text-warning',
    pattern: 'striped',
  },
};

/**
 * Get status styling for a given server status
 * 
 * @param status Server status value
 * @returns Complete status style configuration
 */
export function getStatusStyle(status: ServerStatus | string): StatusStyle {
  const normalizedStatus = normalizeStatusString(status);
  const colors = STATUS_COLORS[normalizedStatus] || STATUS_COLORS[ServerStatus.UNKNOWN];
  
  const badgeClasses: Record<ServerStatus, string> = {
    [ServerStatus.RUNNING]: 'badge-success',
    [ServerStatus.STOPPED]: 'badge-ghost',
    [ServerStatus.STARTING]: 'badge-info',
    [ServerStatus.STOPPING]: 'badge-warning',
    [ServerStatus.FAILED]: 'badge-error',
    [ServerStatus.UNKNOWN]: 'badge-warning badge-outline',
  };

  const isTransitioning = normalizedStatus === ServerStatus.STARTING || normalizedStatus === ServerStatus.STOPPING;
  
  return {
    badgeClass: badgeClasses[normalizedStatus] || badgeClasses[ServerStatus.UNKNOWN],
    textClass: colors.text,
    bgClass: colors.bg,
    borderClass: colors.text.replace('text-', 'border-'),
    icon: getStatusIcon(normalizedStatus),
    animate: isTransitioning,
    pattern: colors.pattern,
  };
}

/**
 * Get icon for a server status
 * 
 * @param status Server status value
 * @returns Emoji icon representing the status
 */
export function getStatusIcon(status: ServerStatus | string): string {
  const normalizedStatus = normalizeStatusString(status);
  
  const icons: Record<ServerStatus, string> = {
    [ServerStatus.RUNNING]: '🟢',
    [ServerStatus.STOPPED]: '🔴',
    [ServerStatus.STARTING]: '🟡',
    [ServerStatus.STOPPING]: '🟠',
    [ServerStatus.FAILED]: '💥',
    [ServerStatus.UNKNOWN]: '❓',
  };

  return icons[normalizedStatus] || icons[ServerStatus.UNKNOWN];
}

/**
 * Get human-readable label for a server status
 * 
 * @param status Server status value
 * @param reason Optional reason for failed/unknown states
 * @returns Human-readable status label
 */
export function getStatusLabel(status: ServerStatus | string, reason?: string): string {
  const normalizedStatus = normalizeStatusString(status);
  
  const labels: Record<ServerStatus, string> = {
    [ServerStatus.RUNNING]: 'Running',
    [ServerStatus.STOPPED]: 'Stopped',
    [ServerStatus.STARTING]: 'Starting',
    [ServerStatus.STOPPING]: 'Stopping',
    [ServerStatus.FAILED]: 'Failed',
    [ServerStatus.UNKNOWN]: 'Unknown',
  };

  const baseLabel = labels[normalizedStatus] || 'Unknown';
  
  // Add reason for failed/unknown states if available
  if ((normalizedStatus === ServerStatus.FAILED || normalizedStatus === ServerStatus.UNKNOWN) && reason) {
    // Truncate long reasons
    const truncatedReason = reason.length > 50 ? `${reason.substring(0, 47)}...` : reason;
    return `${baseLabel}: ${truncatedReason}`;
  }
  
  return baseLabel;
}

/**
 * Get DaisyUI badge class for a server status
 * 
 * @param status Server status value
 * @param withAnimation Whether to include animation classes
 * @returns DaisyUI badge class string
 */
export function getStatusBadgeClass(status: ServerStatus | string, withAnimation: boolean = true): string {
  const style = getStatusStyle(status);
  let classes = `badge ${style.badgeClass}`;
  
  if (withAnimation && style.animate) {
    classes += ' animate-pulse';
  }
  
  return classes;
}

/**
 * Get extended status information for detailed displays
 * 
 * @param status Server status value
 * @param reason Optional reason
 * @returns Extended status information
 */
export function getExtendedStatusInfo(status: ServerStatus | string, reason?: string): {
  label: string;
  description: string;
  icon: string;
  severity: 'success' | 'info' | 'warning' | 'error' | 'neutral';
} {
  const normalizedStatus = normalizeStatusString(status);
  
  const descriptions: Record<ServerStatus, string> = {
    [ServerStatus.RUNNING]: 'Server is online and accepting connections',
    [ServerStatus.STOPPED]: 'Server is offline',
    [ServerStatus.STARTING]: 'Server is starting up, please wait...',
    [ServerStatus.STOPPING]: 'Server is shutting down...',
    [ServerStatus.FAILED]: reason || 'Server encountered an error',
    [ServerStatus.UNKNOWN]: reason || 'Unable to determine server status',
  };

  const severities: Record<ServerStatus, 'success' | 'info' | 'warning' | 'error' | 'neutral'> = {
    [ServerStatus.RUNNING]: 'success',
    [ServerStatus.STOPPED]: 'neutral',
    [ServerStatus.STARTING]: 'info',
    [ServerStatus.STOPPING]: 'warning',
    [ServerStatus.FAILED]: 'error',
    [ServerStatus.UNKNOWN]: 'warning',
  };

  return {
    label: getStatusLabel(normalizedStatus),
    description: descriptions[normalizedStatus] || descriptions[ServerStatus.UNKNOWN],
    icon: getStatusIcon(normalizedStatus),
    severity: severities[normalizedStatus] || 'neutral',
  };
}

/**
 * Normalize a status string to ServerStatus enum value
 * 
 * @param status Raw status string
 * @returns Normalized ServerStatus value
 */
function normalizeStatusString(status: ServerStatus | string): ServerStatus {
  if (Object.values(ServerStatus).includes(status as ServerStatus)) {
    return status as ServerStatus;
  }
  
  const statusLower = String(status).toLowerCase();
  
  // Map legacy/alternative status names
  const statusMap: Record<string, ServerStatus> = {
    'online': ServerStatus.RUNNING,
    'offline': ServerStatus.STOPPED,
    'error': ServerStatus.FAILED,
    'crashed': ServerStatus.FAILED,
    'restarting': ServerStatus.STARTING,
    'exited': ServerStatus.STOPPED,
    'created': ServerStatus.STOPPED,
    'paused': ServerStatus.STOPPED,
  };
  
  return statusMap[statusLower] || ServerStatus.UNKNOWN;
}

/**
 * CSS for striped pattern (for unknown/stale states)
 * Add this to your global CSS or use with styled-jsx
 */
export const STRIPED_PATTERN_CSS = `
  .status-striped {
    background-image: linear-gradient(
      45deg,
      transparent 25%,
      rgba(255, 255, 255, 0.1) 25%,
      rgba(255, 255, 255, 0.1) 50%,
      transparent 50%,
      transparent 75%,
      rgba(255, 255, 255, 0.1) 75%
    );
    background-size: 8px 8px;
  }
`;
