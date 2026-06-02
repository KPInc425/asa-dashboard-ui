/**
 * NoOpAdapter
 *
 * A no-operation adapter that returns empty data and zero capabilities.
 * Used when an environment has no reachable backend, allowing pages to
 * render in deep-link-only mode without error handling for missing adapters.
 *
 * @see /home/steam/automation/docs/plans/phase6-backend-adapter-design.md
 */

import type { BackendBinding, ConnectionState } from "../types/environment";
import type { CapabilityManifest } from "../types/capabilities";
import type { ServiceEntry } from "../types/inventory";
import type {
    BackendAdapter,
    ServiceStatusData,
    HealthStatusData,
    TypedAction,
    ActionResult,
    LogOptions,
    LogEntry,
    AuthCredentials,
    AuthResult,
} from "./types";

/**
 * A no-operation adapter that degrades gracefully for every method.
 *
 * - Returns empty arrays for list / get methods
 * - Returns `'disconnected'` for connection state
 * - Returns an empty capability manifest
 * - Returns null / empty results for actions
 * - Never errors — always degrades gracefully
 */
export class NoOpAdapter implements BackendAdapter {
    readonly backendType = "unknown" as const;
    readonly backendId: string;
    private _connectionState: ConnectionState = "disconnected";
    private _expiredCallbacks: Array<() => void> = [];

    constructor(binding: BackendBinding) {
        this.backendId = binding.backendId;
    }

    // -----------------------------------------------------------------------
    // Connection lifecycle
    // -----------------------------------------------------------------------

    /** @inheritdoc */
    async connect(): Promise<void> {
        // No-op: no backend to connect to.
        this._connectionState = "disconnected";
    }

    /** @inheritdoc */
    disconnect(): void {
        this._connectionState = "disconnected";
    }

    /** @inheritdoc */
    getConnectionState(): ConnectionState {
        return this._connectionState;
    }

    // -----------------------------------------------------------------------
    // Capability discovery
    // -----------------------------------------------------------------------

    /** @inheritdoc */
    async discoverCapabilities(): Promise<CapabilityManifest> {
        return {
            backendId: this.backendId,
            capabilities: [],
            version: 0,
            generatedAt: Date.now(),
        };
    }

    // -----------------------------------------------------------------------
    // Resource listing
    // -----------------------------------------------------------------------

    /** @inheritdoc */
    async listServices(): Promise<ServiceEntry[]> {
        return [];
    }

    /** @inheritdoc */
    async getService(_serviceId: string): Promise<ServiceEntry> {
        throw Object.assign(new Error("No backend available"), {
            canonicalCode: "backend_unreachable",
        });
    }

    // -----------------------------------------------------------------------
    // Status and health
    // -----------------------------------------------------------------------

    /** @inheritdoc */
    async getServiceStatus(_serviceId: string): Promise<ServiceStatusData> {
        return {
            serviceId: _serviceId,
            status: "unknown",
            lastCheckedAt: Date.now(),
            source: "cache",
        };
    }

    /** @inheritdoc */
    async getServiceHealth(_serviceId: string): Promise<HealthStatusData> {
        return {
            serviceId: _serviceId,
            health: "unknown",
            lastCheckedAt: Date.now(),
        };
    }

    // -----------------------------------------------------------------------
    // Actions
    // -----------------------------------------------------------------------

    /** @inheritdoc */
    async executeAction(
        _serviceId: string,
        action: TypedAction,
    ): Promise<ActionResult> {
        return {
            actionId: action.actionId,
            success: false,
            message: "No backend available to execute action",
            error: "backend_unreachable",
            completedAt: Date.now(),
        };
    }

    /** @inheritdoc */
    async getAvailableActions(_serviceId: string): Promise<TypedAction[]> {
        return [];
    }

    // -----------------------------------------------------------------------
    // Logs
    // -----------------------------------------------------------------------

    /** @inheritdoc */
    async getLogs(
        _serviceId: string,
        _options?: LogOptions,
    ): Promise<LogEntry[]> {
        return [];
    }

    /** @inheritdoc */
    streamLogs(
        _serviceId: string,
        _callback: (entry: LogEntry) => void,
    ): () => void {
        // No-op: return a no-op cleanup function.
        return () => {};
    }

    // -----------------------------------------------------------------------
    // Config
    // -----------------------------------------------------------------------

    /** @inheritdoc */
    async getConfig(_serviceId: string): Promise<string> {
        return "";
    }

    /** @inheritdoc */
    async updateConfig(_serviceId: string, _content: string): Promise<void> {
        // No-op.
    }

    // -----------------------------------------------------------------------
    // Authentication
    // -----------------------------------------------------------------------

    /** @inheritdoc */
    async authenticate(_credentials: AuthCredentials): Promise<AuthResult> {
        return {
            success: false,
            error: "No backend available for authentication",
        };
    }

    /** @inheritdoc */
    isAuthenticated(): boolean {
        return false;
    }

    /** @inheritdoc */
    getAuthToken(): string | null {
        return null;
    }

    /** @inheritdoc */
    onAuthExpired(callback: () => void): void {
        this._expiredCallbacks.push(callback);
    }

    // -----------------------------------------------------------------------
    // Cleanup
    // -----------------------------------------------------------------------

    /** @inheritdoc */
    destroy(): void {
        this._expiredCallbacks = [];
        this._connectionState = "disconnected";
    }
}
