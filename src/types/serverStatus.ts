import type { AutoUpdateStatusResponse } from './autoUpdate';

/**
 * Server Status Types
 * 
 * TypeScript types matching the backend status contract defined in
 * docs/STATUS_ERROR_CONTRACT.md
 * 
 * These types provide a single source of truth for server status data
 * across the frontend application.
 */

/**
 * Canonical server status values
 */
export const ServerStatus = {
  RUNNING: 'running',
  STOPPED: 'stopped',
  STARTING: 'starting',
  STOPPING: 'stopping',
  FAILED: 'failed',
  UNKNOWN: 'unknown'
} as const;

export type ServerStatus = typeof ServerStatus[keyof typeof ServerStatus];

/**
 * Data source priority for status information
 * - process: Local process detection (highest priority)
 * - rcon: RCON command response
 * - query: Server browser query
 * - cached: Last known good data (lowest priority)
 */
export type DataSource = 'process' | 'rcon' | 'query' | 'cached';

/**
 * Player information from server
 */
export interface PlayerInfo {
  id?: string;
  name: string;
  steamId?: string;
  odid?: string;
  joinedAt?: string;
}

/**
 * Tracks server state transitions for UI feedback
 */
export interface TransitionState {
  status: ServerStatus;
  previousStatus?: ServerStatus;
  transitionStartedAt?: string;
  expectedDuration?: number;
}

/**
 * Crash information for failed servers
 */
export interface CrashInfo {
  exitCode?: number;
  exitSignal?: string;
  reason: string;
  timestamp: string;
}

/**
 * Server live data - the standard response format for server status
 * This is the primary data structure for real-time server information
 */
export interface ServerLiveData {
  /** Unique server identifier */
  serverId: string;
  /** Current server status */
  status: ServerStatus;
  /** Present during status transitions */
  transition?: TransitionState;
  /** Player information */
  players: {
    online: number;
    max: number;
    list?: PlayerInfo[];
  };
  /** Performance metrics */
  performance?: {
    cpu?: number;
    memory?: number;
    uptime?: number;
  };
  /** Game-specific data */
  gameData?: {
    map?: string;
    day?: number;
    version?: string;
  };
  /** ISO 8601 timestamp of data collection */
  updatedAt: string;
  /** Where this data came from */
  source: DataSource;
  /** ISO 8601 timestamp when data becomes stale */
  staleAfter?: string;
  /** Reason for failed/unknown states */
  reason?: string;
  /** Crash information for failed servers */
  crashInfo?: CrashInfo;
}

/**
 * RFC 7807 Problem Details error format
 * All API errors follow this standardized format
 */
export interface ProblemDetails {
  /** URI reference identifying error type */
  type: string;
  /** Short human-readable summary */
  title: string;
  /** HTTP status code */
  status: number;
  /** Detailed human-readable explanation */
  detail?: string;
  /** URI of specific occurrence */
  instance?: string;
  /** Application error code (e.g., 'SERVER_NOT_FOUND') */
  code?: string;
  /** Related server ID if applicable */
  serverId?: string;
  /** Seconds to wait before retrying */
  retryAfter?: number;
  /** ISO 8601 timestamp of error */
  timestamp?: string;
}

/**
 * Standard error codes used by the API
 */
export const ErrorCode = {
  SERVER_NOT_FOUND: 'SERVER_NOT_FOUND',
  SERVER_OFFLINE: 'SERVER_OFFLINE',
  RCON_FAILED: 'RCON_FAILED',
  TIMEOUT: 'TIMEOUT',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  RATE_LIMITED: 'RATE_LIMITED'
} as const;

export type ErrorCode = typeof ErrorCode[keyof typeof ErrorCode];

/**
 * Generic API response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

/**
 * Server list item (summary data for server list views)
 */
export interface ServerSummary {
  name: string;
  status: ServerStatus | string;
  type: 'container' | 'native' | 'cluster' | 'cluster-server' | 'individual';
  image?: string;
  ports?: unknown[];
  created?: string;
  serverCount?: number;
  maps?: string;
  config?: unknown;
  clusterName?: string;
  map?: string;
  gamePort?: number;
  queryPort?: number;
  rconPort?: number;
  maxPlayers?: number;
  serverPath?: string;
  players?: number;
  isClusterServer?: boolean;
  autoUpdateStatus?: Pick<
    AutoUpdateStatusResponse,
    'status' | 'updateAvailable' | 'currentVersion' | 'latestVersion' | 'lastCheck' | 'message'
  >;
}

/**
 * Server action result
 */
export interface ServerActionResult {
  success: boolean;
  message: string;
}

/**
 * Type guard to check if a value is a ServerStatus value
 */
export function isServerStatus(value: string): value is ServerStatus {
  return Object.values(ServerStatus).includes(value as ServerStatus);
}

/**
 * Normalize legacy status values to ServerStatus
 */
export function normalizeStatus(status: string): ServerStatus {
  const statusMap: Record<string, ServerStatus> = {
    'online': ServerStatus.RUNNING,
    'offline': ServerStatus.STOPPED,
    'error': ServerStatus.FAILED,
    'crashed': ServerStatus.FAILED,
    'restarting': ServerStatus.STARTING,
  };

  if (isServerStatus(status)) {
    return status;
  }

  return statusMap[status.toLowerCase()] || ServerStatus.UNKNOWN;
}

/**
 * Check if server live data is stale
 */
export function isDataStale(data: ServerLiveData): boolean {
  if (!data.staleAfter) {
    return false;
  }
  return new Date(data.staleAfter) < new Date();
}

/**
 * Check if a response is a ProblemDetails error
 */
export function isProblemDetails(value: unknown): value is ProblemDetails {
  return (
    typeof value === 'object' &&
    value !== null &&
    'type' in value &&
    'title' in value &&
    'status' in value
  );
}
