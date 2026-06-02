/**
 * Adapter Contract Types
 *
 * Types for the multi-backend adapter abstraction. Each backend type (ASA
 * control API, deployctl, future backends) implements the BackendAdapter
 * interface to provide a uniform API that the dashboard pages consume.
 *
 * @see /home/steam/automation/docs/plans/phase6-backend-adapter-design.md
 */

import type { BackendType, ConnectionState } from "../types/environment";
import type { CapabilityManifest } from "../types/capabilities";
import type {
    ServiceEntry,
    ServiceStatus,
    HealthStatus,
} from "../types/inventory";

// ---------------------------------------------------------------------------
// Logging
// ---------------------------------------------------------------------------

/**
 * Options for fetching log entries from a backend.
 */
export interface LogOptions {
    /** Number of recent lines to fetch */
    tail?: number;
    /** Timestamp (epoch ms) to fetch logs since */
    since?: number;
    /** Search term filter */
    filter?: string;
    /** Whether to enable streaming */
    stream?: boolean;
}

/**
 * A single log entry from a backend.
 */
export interface LogEntry {
    /** Timestamp (epoch ms) when the log was emitted */
    timestamp: number;
    /** Severity level */
    level: "info" | "warn" | "error" | "debug";
    /** Log message content */
    message: string;
    /** Source component or container name */
    source?: string;
    /** Raw backend-specific log line */
    raw?: string;
}

// ---------------------------------------------------------------------------
// Status & Health
// ---------------------------------------------------------------------------

/**
 * Normalised status data for a single service.
 */
export interface ServiceStatusData {
    /** Canonical service ID */
    serviceId: string;
    /** Normalised service status */
    status: ServiceStatus;
    /** Backend-specific raw status value */
    statusRaw?: string;
    /** Service uptime in seconds */
    uptime?: number;
    /** Number of connected players */
    players?: number;
    /** Memory usage in bytes */
    memory?: { used: number; total: number };
    /** CPU usage as a fraction (0-1) */
    cpu?: number;
    /** Timestamp (epoch ms) when this data was last fetched from the backend */
    lastCheckedAt: number;
    /** Origin of this status data */
    source: "backend" | "cache" | "external";
}

/**
 * Normalised health data for a single service.
 */
export interface HealthStatusData {
    /** Canonical service ID */
    serviceId: string;
    /** Normalised health assessment */
    health: HealthStatus;
    /** Backend-specific raw health value */
    healthRaw?: string;
    /** Individual health check results */
    checks?: { name: string; status: string; detail?: string }[];
    /** Timestamp (epoch ms) when this data was last checked */
    lastCheckedAt: number;
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

/**
 * A typed action that can be executed against a service.
 *
 * Actions are backend-specific commands like restart, stop, backup, or
 * update-mods. Each action carries metadata about its risk level and
 * visibility, allowing the UI to gate destructive actions behind
 * confirmation dialogs.
 */
export interface TypedAction {
    /** Machine-readable action identifier (e.g. "restart", "backup") */
    actionId: string;
    /** Human-readable label for UI buttons */
    label: string;
    /** How risky this action is — drives confirmation behaviour */
    riskLevel: "low" | "medium" | "high" | "critical";
    /** Optional message to show in a confirmation dialog */
    confirmMessage?: string;
    /** Optional JSON Schema describing expected input parameters */
    inputSchema?: Record<string, unknown>;
    /** Estimated duration in seconds (for progress tracking) */
    estimatedDuration?: number;
    /** Whether the backend reports progress for this action */
    supportsProgress: boolean;
}

/**
 * The result of executing a typed action against a service.
 */
export interface ActionResult {
    /** The action ID that was executed */
    actionId: string;
    /** Whether the action was accepted by the backend */
    success: boolean;
    /** If the action spawns a background job, the job identifier */
    jobId?: string;
    /** Human-readable result message */
    message: string;
    /** Progress percentage (0-100) for long-running actions */
    progress?: number;
    /** Error message if the action failed */
    error?: string;
    /** Timestamp (epoch ms) when the action completed */
    completedAt?: number;
}

// ---------------------------------------------------------------------------
// Authentication
// ---------------------------------------------------------------------------

/**
 * Credentials for authenticating with a backend.
 *
 * Only one of `password`, `token`, or `apiKey` should be provided, depending
 * on the backend's auth profile type.
 */
export interface AuthCredentials {
    /** Username or client ID */
    username?: string;
    /** Password or client secret */
    password?: string;
    /** Pre-existing token (e.g. for re-authentication) */
    token?: string;
    /** Static API key */
    apiKey?: string;
}

/**
 * Result of an authentication attempt.
 */
export interface AuthResult {
    /** Whether authentication succeeded */
    success: boolean;
    /** JWT or session token if authentication was successful */
    token?: string;
    /** Timestamp (epoch ms) when the token expires */
    expiresAt?: number;
    /** Error message if authentication failed */
    error?: string;
    /** User information returned by the backend */
    user?: { id: string; username: string; roles: string[] };
}

// ---------------------------------------------------------------------------
// Canonical error
// ---------------------------------------------------------------------------

/**
 * Canonical error categories that all adapters normalise to.
 *
 * Each adapter maps backend-specific errors (HTTP status codes, error
 * messages) into one of these categories so that the UI can handle errors
 * uniformly across backends.
 */
export type CanonicalError =
    | "auth_expired"
    | "auth_required"
    | "not_found"
    | "already_running"
    | "already_stopped"
    | "action_in_progress"
    | "rate_limited"
    | "backend_unreachable"
    | "timeout"
    | "unknown";

// ---------------------------------------------------------------------------
// Adapter interface
// ---------------------------------------------------------------------------

/**
 * The core adapter interface that every backend adapter implements.
 *
 * Each method maps to a backend-specific operation. Adapters normalise
 * responses into canonical types and handle backend-specific errors.
 *
 * Usage:
 * ```typescript
 * const adapter = adapterRegistry.get('asa-control-api');
 * const services = await adapter?.listServices();
 * ```
 */
export interface BackendAdapter {
    // -----------------------------------------------------------------------
    // Identity
    // -----------------------------------------------------------------------

    /** The type of backend this adapter communicates with */
    readonly backendType: BackendType;
    /** Unique identifier for this adapter instance (matches BackendBinding.backendId) */
    readonly backendId: string;

    // -----------------------------------------------------------------------
    // Connection lifecycle
    // -----------------------------------------------------------------------

    /** Open a connection to the backend (may be a no-op for REST-only backends) */
    connect(): Promise<void>;
    /** Tear down the connection (cancel pending requests, close sockets) */
    disconnect(): void;
    /** Return the current connection state */
    getConnectionState(): ConnectionState;

    // -----------------------------------------------------------------------
    // Capability discovery
    // -----------------------------------------------------------------------

    /** Discover the capabilities this backend supports */
    discoverCapabilities(): Promise<CapabilityManifest>;

    // -----------------------------------------------------------------------
    // Resource listing
    // -----------------------------------------------------------------------

    /** List all services this backend manages */
    listServices(): Promise<ServiceEntry[]>;
    /** Get a single service by its canonical service ID */
    getService(serviceId: string): Promise<ServiceEntry>;

    // -----------------------------------------------------------------------
    // Status and health
    // -----------------------------------------------------------------------

    /** Get the runtime status of a specific service */
    getServiceStatus(serviceId: string): Promise<ServiceStatusData>;
    /** Get the health assessment of a specific service */
    getServiceHealth(serviceId: string): Promise<HealthStatusData>;

    // -----------------------------------------------------------------------
    // Actions (typed commands)
    // -----------------------------------------------------------------------

    /** Execute a typed action against a service */
    executeAction(
        serviceId: string,
        action: TypedAction,
    ): Promise<ActionResult>;
    /** List the available actions for a service */
    getAvailableActions(serviceId: string): Promise<TypedAction[]>;

    // -----------------------------------------------------------------------
    // Logs
    // -----------------------------------------------------------------------

    /** Fetch log entries for a service */
    getLogs(serviceId: string, options?: LogOptions): Promise<LogEntry[]>;
    /**
     * Stream log entries in real time.
     *
     * @param serviceId - The service to stream logs for
     * @param callback  - Called for each log entry as it arrives
     * @returns A function that stops the stream when called
     */
    streamLogs(
        serviceId: string,
        callback: (entry: LogEntry) => void,
    ): () => void;

    // -----------------------------------------------------------------------
    // Config (optional, capability-gated)
    // -----------------------------------------------------------------------

    /** Get the configuration content for a service */
    getConfig(serviceId: string): Promise<string>;
    /** Update the configuration content for a service */
    updateConfig(serviceId: string, content: string): Promise<void>;

    // -----------------------------------------------------------------------
    // Authentication (per-adapter)
    // -----------------------------------------------------------------------

    /** Authenticate with the backend using the provided credentials */
    authenticate(credentials: AuthCredentials): Promise<AuthResult>;
    /** Whether the adapter currently holds a valid authentication token */
    isAuthenticated(): boolean;
    /** Return the current authentication token, or null if not authenticated */
    getAuthToken(): string | null;
    /** Register a callback that fires when the authentication token expires */
    onAuthExpired(callback: () => void): void;

    // -----------------------------------------------------------------------
    // Cleanup
    // -----------------------------------------------------------------------

    /** Release all resources held by the adapter */
    destroy(): void;
}
