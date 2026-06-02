/**
 * ASAAdapter
 *
 * Maps the existing ASA backend REST API to the BackendAdapter contract.
 * Uses the Axios instance from api-core.ts for HTTP calls and the
 * SocketManager from socket.ts for streaming operations.
 *
 * @see /home/steam/automation/docs/plans/phase6-backend-adapter-design.md
 */

import axios from "axios";
import type { AxiosInstance } from "axios";
import type { BackendBinding, ConnectionState } from "../types/environment";
import type { CapabilityManifest } from "../types/capabilities";
import type { ServiceEntry, ServiceStatus } from "../types/inventory";
import { staticCapabilityManifests } from "./capabilities";
import { socketManager } from "../services/socket";
import type { LogMessage } from "../services/socket";
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
    CanonicalError,
} from "./types";

// ---------------------------------------------------------------------------
// Status normalisation
// ---------------------------------------------------------------------------

/**
 * Map ASA backend raw status values to the canonical ServiceStatus enum.
 *
 * | ASA Backend Raw Value       | Canonical ServiceStatus |
 * |-----------------------------|------------------------|
 * | `running`, `true`           | `running`              |
 * | `stopped`, `exited`, `false`| `stopped`              |
 * | `restarting`, `paused`      | `degraded`             |
 * | `updating`                  | `updating`             |
 * | anything else               | `unknown`              |
 */
function normalizeStatus(raw: string | boolean | undefined): ServiceStatus {
    if (raw === undefined || raw === null) return "unknown";

    // Boolean from /running endpoints
    if (typeof raw === "boolean") {
        return raw ? "running" : "stopped";
    }

    const lower = raw.toLowerCase();

    if (lower === "running" || lower === "true") return "running";
    if (lower === "stopped" || lower === "exited" || lower === "false")
        return "stopped";
    if (lower === "restarting" || lower === "paused") return "degraded";
    if (lower === "updating") return "updating";

    return "unknown";
}

// ---------------------------------------------------------------------------
// Error normalisation
// ---------------------------------------------------------------------------

/**
 * Map an Axios error to a canonical error code.
 */
function normalizeError(error: unknown): CanonicalError {
    if (!error || typeof error !== "object") return "unknown";

    const err = error as {
        status?: number;
        response?: { status?: number };
        message?: string;
        code?: string;
    };

    const status = err.status ?? err.response?.status ?? 0;

    if (status === 401) return "auth_expired";
    if (status === 403) return "auth_required";
    if (status === 404) return "not_found";
    if (status === 409) {
        const msg = err.message?.toLowerCase() ?? "";
        if (msg.includes("running")) return "already_running";
        if (msg.includes("stopped")) return "already_stopped";
        return "action_in_progress";
    }
    if (status === 429) return "rate_limited";
    if (status === 0 || err.code === "ECONNABORTED") return "timeout";

    return "unknown";
}

// ---------------------------------------------------------------------------
// Action definitions
// ---------------------------------------------------------------------------

/**
 * Available actions derived from SERVER_MODE and service type.
 */
const CONTAINER_ACTIONS: TypedAction[] = [
    {
        actionId: "start",
        label: "Start",
        riskLevel: "low",
        supportsProgress: false,
    },
    {
        actionId: "stop",
        label: "Stop",
        riskLevel: "medium",
        confirmMessage: "Are you sure you want to stop this server?",
        supportsProgress: false,
    },
    {
        actionId: "restart",
        label: "Restart",
        riskLevel: "high",
        confirmMessage: "Are you sure you want to restart this server?",
        estimatedDuration: 120,
        supportsProgress: true,
    },
];

// ---------------------------------------------------------------------------
// ASA Adapter
// ---------------------------------------------------------------------------

/**
 * Adapter for the ASA Control API backend.
 *
 * Maps the existing ASA REST API and Socket.IO events to the uniform
 * BackendAdapter contract. Uses the shared Axios instance from api-core
 * and the singleton SocketManager from socket.ts.
 */
export class ASAAdapter implements BackendAdapter {
    readonly backendType = "asa-control-api" as const;
    readonly backendId: string;

    private readonly binding: BackendBinding;
    private readonly httpClient: AxiosInstance;
    private readonly _environmentId: string;
    private _authToken: string | null = null;
    private _connectionState: ConnectionState = "unknown";
    private _expiredCallbacks: Array<() => void> = [];
    private _authExpiryTimer: ReturnType<typeof setTimeout> | null = null;

    constructor(binding: BackendBinding, environmentId?: string) {
        this.binding = binding;
        this.backendId = binding.backendId;
        this._environmentId = environmentId ?? binding.backendId;

        // Create a dedicated Axios instance scoped to this backend's base URL.
        this.httpClient = axios.create({
            baseURL: binding.baseUrl || "/",
            timeout: 300000,
            headers: { "Content-Type": "application/json" },
            withCredentials: true,
        });

        // Attach request interceptor for auth token.
        this.httpClient.interceptors.request.use((config) => {
            if (this._authToken) {
                config.headers.Authorization = `Bearer ${this._authToken}`;
            }
            return config;
        });

        // Attach response interceptor for error normalisation.
        this.httpClient.interceptors.response.use(
            (response) => response,
            (error) => {
                const canonical = normalizeError(error);
                if (canonical === "auth_expired") {
                    this._notifyAuthExpired();
                }
                return Promise.reject(error);
            },
        );
    }

    // -----------------------------------------------------------------------
    // Connection lifecycle
    // -----------------------------------------------------------------------

    /**
     * Connect to the ASA backend.
     *
     * For the REST-only ASA adapter, this validates connectivity by calling
     * the health endpoint. Socket.IO connections are established on demand
     * by streamLogs.
     */
    async connect(): Promise<void> {
        this._connectionState = "connecting";

        try {
            await this.httpClient.get(
                this.binding.healthEndpoint ?? "/health",
                {
                    timeout: 5_000,
                },
            );
            this._connectionState = "connected";
        } catch {
            // Backend is not reachable — degrade gracefully.
            this._connectionState = "disconnected";
        }
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

    /**
     * Return the static capability manifest for the ASA control API.
     *
     * The current ASA backend does not expose a dynamic discovery endpoint,
     * so we use the static manifest defined in capabilities.ts.
     */
    async discoverCapabilities(): Promise<CapabilityManifest> {
        const manifest = staticCapabilityManifests["asa-control-api"];
        if (manifest) {
            return { ...manifest, generatedAt: Date.now() };
        }
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

    /**
     * List all services by merging containers and native servers.
     *
     * Calls GET /api/containers and GET /api/native-servers, then merges
     * the results with native servers taking priority over containers with
     * the same name.
     */
    async listServices(): Promise<ServiceEntry[]> {
        const [containersRes, nativeServersRes] = await Promise.all([
            this.httpClient
                .get<{
                    success: boolean;
                    containers?: unknown[];
                }>("/api/containers")
                .catch(() => ({ data: { containers: [] } })),
            this.httpClient
                .get<{
                    success: boolean;
                    servers?: unknown[];
                }>("/api/native-servers")
                .catch(() => ({ data: { servers: [] } })),
        ]);

        const containers = (containersRes.data.containers ?? []).map((c: any) =>
            this._toServiceEntry(c, "container"),
        );
        const nativeServers = (nativeServersRes.data.servers ?? []).map(
            (s: any) => this._toServiceEntry(s, "native-server"),
        );

        // Merge: native servers take priority.
        const merged = new Map<string, ServiceEntry>();
        for (const svc of nativeServers) {
            merged.set(svc.serviceId, svc);
        }
        for (const svc of containers) {
            if (!merged.has(svc.serviceId)) {
                merged.set(svc.serviceId, svc);
            }
        }

        return Array.from(merged.values());
    }

    /** @inheritdoc */
    async getService(serviceId: string): Promise<ServiceEntry> {
        // Strip the backend prefix if present: "asa-control-api:my-container" -> "my-container"
        const localId = serviceId.includes(":")
            ? serviceId.split(":").pop()!
            : serviceId;

        // Try native servers first, then containers.
        try {
            const nativeRes = await this.httpClient.get<{
                success: boolean;
                servers?: unknown[];
            }>("/api/native-servers");
            const found = (nativeRes.data.servers ?? []).find(
                (s: any) => s.name === localId,
            );
            if (found)
                return this._toServiceEntry(
                    found as Record<string, unknown>,
                    "native-server",
                );
        } catch {
            // Fall through to containers.
        }

        const containerRes = await this.httpClient.get<{
            success: boolean;
            containers?: unknown[];
        }>("/api/containers");
        const found = (containerRes.data.containers ?? []).find(
            (c: any) => c.name === localId,
        );
        if (found)
            return this._toServiceEntry(
                found as Record<string, unknown>,
                "container",
            );

        throw Object.assign(new Error(`Service not found: ${localId}`), {
            canonicalCode: "not_found",
        });
    }

    // -----------------------------------------------------------------------
    // Status and health
    // -----------------------------------------------------------------------

    /** @inheritdoc */
    async getServiceStatus(serviceId: string): Promise<ServiceStatusData> {
        const localId = serviceId.includes(":")
            ? serviceId.split(":").pop()!
            : serviceId;

        try {
            const res = await this.httpClient.get<{
                success: boolean;
                running: boolean;
            }>(`/api/containers/${encodeURIComponent(localId)}/running`);
            const status = normalizeStatus(res.data.running);
            return {
                serviceId,
                status,
                statusRaw: String(res.data.running),
                lastCheckedAt: Date.now(),
                source: "backend",
            };
        } catch {
            // Fall through to native server status endpoint.
        }

        try {
            const res = await this.httpClient.get<{
                success: boolean;
                status?: {
                    status: string;
                    players?: { online: number; max: number };
                    performance?: {
                        cpu?: number;
                        memory?: number;
                        uptime?: number;
                    };
                };
            }>(`/api/native-servers/${encodeURIComponent(localId)}/status`);

            const statusData = res.data.status;
            const status = normalizeStatus(statusData?.status);

            return {
                serviceId,
                status,
                statusRaw: statusData?.status,
                players: statusData?.players?.online,
                cpu: statusData?.performance?.cpu,
                memory: statusData?.performance?.memory
                    ? { used: statusData.performance.memory, total: 0 }
                    : undefined,
                uptime: statusData?.performance?.uptime,
                lastCheckedAt: Date.now(),
                source: "backend",
            };
        } catch {
            return {
                serviceId,
                status: "unknown",
                lastCheckedAt: Date.now(),
                source: "cache",
            };
        }
    }

    /** @inheritdoc */
    async getServiceHealth(serviceId: string): Promise<HealthStatusData> {
        // The ASA backend does not expose per-service health checks.
        // Return a best-effort assessment based on the status endpoint.
        try {
            const statusData = await this.getServiceStatus(serviceId);
            return {
                serviceId,
                health:
                    statusData.status === "running" ? "healthy" : "unhealthy",
                lastCheckedAt: Date.now(),
            };
        } catch {
            return {
                serviceId,
                health: "unknown",
                lastCheckedAt: Date.now(),
            };
        }
    }

    // -----------------------------------------------------------------------
    // Actions
    // -----------------------------------------------------------------------

    /** @inheritdoc */
    async executeAction(
        serviceId: string,
        action: TypedAction,
    ): Promise<ActionResult> {
        const localId = serviceId.includes(":")
            ? serviceId.split(":").pop()!
            : serviceId;

        const completedAt = Date.now();

        try {
            switch (action.actionId) {
                case "start": {
                    const startRes = await this.httpClient.post<{
                        success: boolean;
                        message?: string;
                    }>(`/api/containers/${encodeURIComponent(localId)}/start`);
                    return {
                        actionId: action.actionId,
                        success: startRes.data.success,
                        message:
                            startRes.data.message ??
                            `Server "${localId}" started`,
                        completedAt,
                    };
                }

                case "stop": {
                    const stopRes = await this.httpClient.post<{
                        success: boolean;
                        message?: string;
                    }>(`/api/containers/${encodeURIComponent(localId)}/stop`);
                    return {
                        actionId: action.actionId,
                        success: stopRes.data.success,
                        message:
                            stopRes.data.message ??
                            `Server "${localId}" stopped`,
                        completedAt,
                    };
                }

                case "restart": {
                    const restartRes = await this.httpClient.post<{
                        success: boolean;
                        message?: string;
                    }>(
                        `/api/containers/${encodeURIComponent(localId)}/restart`,
                    );
                    return {
                        actionId: action.actionId,
                        success: restartRes.data.success,
                        message:
                            restartRes.data.message ??
                            `Server "${localId}" restart initiated`,
                        completedAt,
                    };
                }

                default:
                    return {
                        actionId: action.actionId,
                        success: false,
                        message: `Action "${action.actionId}" is not supported by the ASA backend`,
                        error: "unknown",
                        completedAt,
                    };
            }
        } catch (error: unknown) {
            const err = error as {
                response?: { data?: { message?: string } };
                message?: string;
            };
            return {
                actionId: action.actionId,
                success: false,
                message:
                    err.response?.data?.message ??
                    err.message ??
                    "Action failed",
                error: normalizeError(error),
                completedAt,
            };
        }
    }

    /** @inheritdoc */
    async getAvailableActions(_serviceId: string): Promise<TypedAction[]> {
        return [...CONTAINER_ACTIONS];
    }

    // -----------------------------------------------------------------------
    // Logs
    // -----------------------------------------------------------------------

    /** @inheritdoc */
    async getLogs(
        serviceId: string,
        options?: LogOptions,
    ): Promise<LogEntry[]> {
        const localId = serviceId.includes(":")
            ? serviceId.split(":").pop()!
            : serviceId;

        const params: Record<string, string | number> = {};
        if (options?.tail) params.tail = options.tail;
        if (options?.since) params.since = options.since;
        if (options?.filter) params.filter = options.filter;

        try {
            const res = await this.httpClient.get<{
                success: boolean;
                content?: string;
                lines?: {
                    timestamp?: string;
                    level?: string;
                    message?: string;
                }[];
            }>(`/api/containers/${encodeURIComponent(localId)}/logs`, {
                params,
            });

            // Handle both structured lines and raw content responses.
            if (res.data.lines) {
                return res.data.lines.map((line) => ({
                    timestamp: line.timestamp
                        ? new Date(line.timestamp).getTime()
                        : Date.now(),
                    level: (line.level as LogEntry["level"]) ?? "info",
                    message: line.message ?? "",
                    source: localId,
                }));
            }

            // Fallback: parse raw content by newlines.
            const content = res.data.content ?? "";
            return content
                .split("\n")
                .filter(Boolean)
                .map((line: string) => ({
                    timestamp: Date.now(),
                    level: "info" as const,
                    message: line,
                    source: localId,
                    raw: line,
                }));
        } catch {
            return [];
        }
    }

    /** @inheritdoc */
    streamLogs(
        serviceId: string,
        callback: (entry: LogEntry) => void,
    ): () => void {
        const localId = serviceId.includes(":")
            ? serviceId.split(":").pop()!
            : serviceId;

        // Connect Socket.IO for the container if not already connected.
        socketManager.connect(localId).catch(() => {
            // If Socket.IO fails, the callback simply won't receive streaming events.
        });

        // Subscribe to container log events.
        // The socketManager already transforms raw data into LogMessage format.
        const handleLog = (data: LogMessage) => {
            callback({
                timestamp: data.timestamp
                    ? new Date(data.timestamp).getTime()
                    : Date.now(),
                level: data.level,
                message: data.message,
                source: data.container ?? localId,
            });
        };

        socketManager.onContainerLog(handleLog);

        // Return a cleanup function.
        return () => {
            socketManager.offContainerLog();
        };
    }

    // -----------------------------------------------------------------------
    // Config
    // -----------------------------------------------------------------------

    /** @inheritdoc */
    async getConfig(serviceId: string): Promise<string> {
        const localId = serviceId.includes(":")
            ? serviceId.split(":").pop()!
            : serviceId;

        const res = await this.httpClient.get<{
            success: boolean;
            content: string;
        }>(`/api/configs/GameUserSettings/${encodeURIComponent(localId)}`);
        return res.data.content;
    }

    /** @inheritdoc */
    async updateConfig(serviceId: string, content: string): Promise<void> {
        const localId = serviceId.includes(":")
            ? serviceId.split(":").pop()!
            : serviceId;

        await this.httpClient.post(
            `/api/configs/GameUserSettings/${encodeURIComponent(localId)}`,
            { content },
        );
    }

    // -----------------------------------------------------------------------
    // Authentication
    // -----------------------------------------------------------------------

    /** @inheritdoc */
    async authenticate(credentials: AuthCredentials): Promise<AuthResult> {
        try {
            const res = await this.httpClient.post<{
                success: boolean;
                token?: string;
                user?: { username: string; role?: string };
                message?: string;
            }>("/api/auth/login", {
                username: credentials.username,
                password: credentials.password,
            });

            if (res.data.success && res.data.token) {
                this._authToken = res.data.token;

                // Store token in localStorage for backward compatibility.
                localStorage.setItem("auth_token", res.data.token);

                // Set up expiry timer if the token is a JWT with an exp claim.
                this._setupExpiryFromToken(res.data.token);

                return {
                    success: true,
                    token: res.data.token,
                    user: res.data.user
                        ? {
                              id: res.data.user.username,
                              username: res.data.user.username,
                              roles: res.data.user.role
                                  ? [res.data.user.role]
                                  : [],
                          }
                        : undefined,
                };
            }

            return {
                success: false,
                error: res.data.message ?? "Authentication failed",
            };
        } catch (error: unknown) {
            const err = error as {
                response?: { data?: { message?: string } };
                message?: string;
            };
            return {
                success: false,
                error:
                    err.response?.data?.message ??
                    err.message ??
                    "Authentication failed",
            };
        }
    }

    /** @inheritdoc */
    isAuthenticated(): boolean {
        if (!this._authToken) return false;

        // Quick JWT expiry check without decoding the full payload.
        try {
            const payload = this._authToken.split(".")[1];
            if (!payload) return false;
            const decoded = JSON.parse(atob(payload));
            if (decoded.exp && decoded.exp * 1000 < Date.now()) {
                this._authToken = null;
                localStorage.removeItem("auth_token");
                return false;
            }
            return true;
        } catch {
            return !!this._authToken;
        }
    }

    /** @inheritdoc */
    getAuthToken(): string | null {
        return this._authToken ?? localStorage.getItem("auth_token");
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
        if (this._authExpiryTimer) {
            clearTimeout(this._authExpiryTimer);
            this._authExpiryTimer = null;
        }
        this._expiredCallbacks = [];
        this._authToken = null;
        this._connectionState = "disconnected";
    }

    // -----------------------------------------------------------------------
    // Private helpers
    // -----------------------------------------------------------------------

    /**
     * Transform a raw container or native-server object into a canonical
     * ServiceEntry.
     */
    private _toServiceEntry(
        raw: Record<string, unknown>,
        sourceType: "container" | "native-server",
    ): ServiceEntry {
        const name = String(raw.name ?? raw.serverName ?? "unknown");

        return {
            serviceId: `${this.backendId}:${name}`,
            environmentId: this._environmentId,
            name,
            kind: "game-server",
            runtimeOwner: sourceType === "container" ? "compose" : "manual",
            lifecycleState: "active",
            ports: [],
            status: normalizeStatus(raw.status as string | boolean | undefined),
            health: "unknown",
            backendId: this.backendId,
            backendResourceId: name,
            tags: [sourceType],
            extensions: { ...raw, _sourceType: sourceType },
        };
    }

    /**
     * Parse the JWT expiry and schedule auth-expired notification.
     */
    private _setupExpiryFromToken(token: string): void {
        try {
            const payload = token.split(".")[1];
            if (!payload) return;
            const decoded = JSON.parse(atob(payload));
            if (decoded.exp) {
                const expiresIn = decoded.exp * 1000 - Date.now();
                if (expiresIn > 0) {
                    this._authExpiryTimer = setTimeout(() => {
                        this._authToken = null;
                        localStorage.removeItem("auth_token");
                        this._notifyAuthExpired();
                    }, expiresIn);
                }
            }
        } catch {
            // Not a JWT or can't parse — ignore.
        }
    }

    /**
     * Notify all registered auth-expired callbacks.
     */
    private _notifyAuthExpired(): void {
        for (const cb of this._expiredCallbacks) {
            try {
                cb();
            } catch {
                // Swallow callback errors to prevent one bad callback from
                // breaking the rest.
            }
        }
    }
}
