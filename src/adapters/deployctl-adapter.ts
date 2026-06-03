/**
 * Deployctl Adapter
 *
 * Adapter for the deployctl local backend tool. Deployctl manages
 * applications defined in apps/*.conf files on the local host using
 * Docker Compose under the hood. This adapter wraps shell calls to
 * deployctl.sh and provides typed adapter responses.
 *
 * ## Method Mappings
 *
 * | Adapter Method       | deployctl Execution              |
 * |----------------------|----------------------------------|
 * | `listServices()`     | `deployctl.sh list`              |
 * | `getService()`       | `deployctl.sh status APP_ID`     |
 * | `getServiceStatus()` | `deployctl.sh status APP_ID`     |
 * | `getServiceHealth()` | `deployctl.sh status APP_ID`     |
 * | `executeAction()`    | `deployctl.sh ACTION APP_ID`     |
 * | `getAvailableActions()` | Static manifest                |
 * | `getLogs()`          | `docker logs` via shell          |
 * | `streamLogs()`       | Not supported (no TTY)           |
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
import { staticCapabilityManifests } from "./capabilities";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Default path to deployctl.sh on the host. */
const DEFAULT_DEPLOYCTL_PATH = "deployctl.sh";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Run deployctl.sh synchronously and return the stdout.
 *
 * In browser environments this returns an empty string (deployctl is not
 * available). The Node.js `execSync` import is lazy-loaded only when
 * this function is called in a Node environment.
 *
 * @param args          - Arguments to pass to deployctl.sh
 * @param cwd           - Optional working directory
 * @param deployctlPath - Path to deployctl.sh binary
 * @returns The stdout from deployctl.sh, or empty string if not available
 */
function runDeployctl(
  args: string[],
  cwd: string | undefined,
  deployctlPath: string,
): string {
  // Detect Node.js environment without importing @types/node
  const isNode =
    typeof process !== "undefined" &&
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (process as any).versions?.node != null;

  if (!isNode) {
    console.warn(
      "[DeployctlAdapter] deployctl.sh is not available in browser environments",
    );
    return "";
  }

  // Lazy-load execSync only in Node.js
  // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
  const { execSync } = require("child_process");
  const cmd = [deployctlPath, ...args].join(" ");
  try {
    return execSync(cmd, {
      cwd,
      encoding: "utf-8",
      timeout: 30_000,
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.warn(`[DeployctlAdapter] deployctl.sh failed: ${cmd}\n${msg}`);
    return "";
  }
}

/**
 * Parse deployctl.sh list output into service entries.
 *
 * Expected output format (one service per line):
 * ```
 * APP_ID          STATUS    PORTS       PATH
 * minecraft-paper running   25565:25565 /opt/minecraft
 * ```
 */
function parseListOutput(output: string): ServiceEntry[] {
  const entries: ServiceEntry[] = [];

  for (const line of output.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("APP_ID")) continue;

    const parts = trimmed.split(/\s{2,}/);
    if (parts.length < 2) continue;

    const [appId, status, ports, path] = parts;

    entries.push({
      serviceId: `svc:deployctl:${appId}`,
      environmentId: "deployctl",
      name: appId,
      kind: "app",
      runtimeOwner: "compose",
      lifecycleState: "active",
      primaryPath: path ?? undefined,
      ports: ports
        ? ports.split(",").map((p) => {
            const [hostPort] = p.trim().split(":");
            return {
              port: parseInt(hostPort, 10) || 0,
              protocol: "tcp",
            };
          })
        : [],
      status: status === "running" ? "running" : "stopped",
      health: status === "running" ? "healthy" : "unknown",
      tags: ["deployctl"],
    });
  }

  return entries;
}

/**
 * Normalise a deployctl status string to a ServiceStatus.
 */
function normalizeStatus(status: string): ServiceStatusData["status"] {
  switch (status.toLowerCase()) {
    case "running":
      return "running";
    case "stopped":
    case "exited":
      return "stopped";
    case "degraded":
      return "degraded";
    default:
      return "unknown";
  }
}

// ---------------------------------------------------------------------------
// DeployctlAdapter
// ---------------------------------------------------------------------------

export class DeployctlAdapter implements BackendAdapter {
  readonly backendType = "deployctl" as const;
  readonly backendId: string;
  private _connectionState: ConnectionState = "disconnected";
  private _expiredCallbacks: Array<() => void> = [];
  private _deployctlPath: string;
  private _cwd: string | undefined;

  constructor(
    binding: BackendBinding,
    options?: { deployctlPath?: string; cwd?: string },
  ) {
    this.backendId = binding.backendId;
    this._deployctlPath = options?.deployctlPath ?? DEFAULT_DEPLOYCTL_PATH;
    this._cwd = options?.cwd;
  }

  private _run(args: string[]): string {
    return runDeployctl(args, this._cwd, this._deployctlPath);
  }

  // -----------------------------------------------------------------------
  // Connection lifecycle
  // -----------------------------------------------------------------------

  /** @inheritdoc */
  async connect(): Promise<void> {
    try {
      const result = this._run(["list"]);
      this._connectionState = result ? "connected" : "disconnected";
    } catch {
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

  /** @inheritdoc */
  async discoverCapabilities(): Promise<CapabilityManifest> {
    return (
      staticCapabilityManifests.deployctl ?? {
        backendId: this.backendId,
        capabilities: [],
        version: 0,
        generatedAt: Date.now(),
      }
    );
  }

  // -----------------------------------------------------------------------
  // Resource listing
  // -----------------------------------------------------------------------

  /** @inheritdoc */
  async listServices(): Promise<ServiceEntry[]> {
    const output = this._run(["list"]);
    return parseListOutput(output);
  }

  /** @inheritdoc */
  async getService(serviceId: string): Promise<ServiceEntry> {
    const localId = serviceId.includes(":")
      ? serviceId.split(":").pop()!
      : serviceId;

    const output = this._run(["status", localId]);
    if (!output) {
      throw Object.assign(new Error(`Service "${localId}" not found`), {
        canonicalCode: "not_found",
      });
    }

    const entries = parseListOutput(output);
    const entry = entries[0];
    if (!entry) {
      throw Object.assign(new Error(`Service "${localId}" not found`), {
        canonicalCode: "not_found",
      });
    }

    return entry;
  }

  // -----------------------------------------------------------------------
  // Status and health
  // -----------------------------------------------------------------------

  /** @inheritdoc */
  async getServiceStatus(serviceId: string): Promise<ServiceStatusData> {
    const localId = serviceId.includes(":")
      ? serviceId.split(":").pop()!
      : serviceId;

    const output = this._run(["status", localId]);
    const status = normalizeStatus(output.split("\n")[0]?.trim() || "unknown");

    return {
      serviceId,
      status,
      statusRaw: output,
      lastCheckedAt: Date.now(),
      source: "backend",
    };
  }

  /** @inheritdoc */
  async getServiceHealth(serviceId: string): Promise<HealthStatusData> {
    const statusData = await this.getServiceStatus(serviceId);
    return {
      serviceId,
      health: statusData.status === "running" ? "healthy" : "unknown",
      healthRaw: statusData.statusRaw,
      lastCheckedAt: Date.now(),
    };
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

    try {
      const output = this._run([action.actionId, localId]);
      return {
        actionId: action.actionId,
        success: true,
        message: output || `${action.label} completed for ${localId}`,
        completedAt: Date.now(),
      };
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      return {
        actionId: action.actionId,
        success: false,
        message: `Failed to ${action.actionId} ${localId}: ${msg}`,
        error: msg,
        completedAt: Date.now(),
      };
    }
  }

  /** @inheritdoc */
  async getAvailableActions(_serviceId: string): Promise<TypedAction[]> {
    return [
      {
        actionId: "restart",
        label: "Restart",
        riskLevel: "high",
        confirmMessage:
          "This will restart the application. There will be brief downtime.",
        supportsProgress: false,
      },
      {
        actionId: "start",
        label: "Start",
        riskLevel: "low",
        supportsProgress: false,
      },
      {
        actionId: "stop",
        label: "Stop",
        riskLevel: "high",
        confirmMessage:
          "This will stop the application and make it unavailable.",
        supportsProgress: false,
      },
    ];
  }

  // -----------------------------------------------------------------------
  // Logs
  // -----------------------------------------------------------------------

  /** @inheritdoc */
  async getLogs(serviceId: string, options?: LogOptions): Promise<LogEntry[]> {
    const localId = serviceId.includes(":")
      ? serviceId.split(":").pop()!
      : serviceId;

    const tail = options?.tail ?? 50;
    const output = this._run(["logs", localId, "--tail", String(tail)]);

    if (!output) return [];

    return output.split("\n").map((line) => ({
      timestamp: Date.now(),
      level: line.toLowerCase().includes("error") ? "error" : "info",
      message: line,
      source: localId,
      raw: line,
    }));
  }

  /** @inheritdoc */
  streamLogs(
    _serviceId: string,
    _callback: (entry: LogEntry) => void,
  ): () => void {
    console.warn(
      "[DeployctlAdapter] streamLogs is not supported for deployctl backend",
    );
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
    throw Object.assign(
      new Error("Config updates are not supported via this adapter"),
      { canonicalCode: "not_found" },
    );
  }

  // -----------------------------------------------------------------------
  // Authentication
  // -----------------------------------------------------------------------

  /** @inheritdoc */
  async authenticate(_credentials: AuthCredentials): Promise<AuthResult> {
    return {
      success: true,
      token: "deployctl-no-auth-required",
      user: { id: "local", username: "local", roles: ["admin"] },
    };
  }

  /** @inheritdoc */
  isAuthenticated(): boolean {
    return true;
  }

  /** @inheritdoc */
  getAuthToken(): string | null {
    return "deployctl-no-auth-required";
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
