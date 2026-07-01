import axios from "axios";
import type { AxiosInstance } from "axios";
import type { BackendBinding, ConnectionState } from "../../types/environment";
import type { CapabilityManifest } from "../../types/capabilities";
import type { ServiceEntry, ServiceStatus } from "../../types/inventory";
import { staticCapabilityManifests } from "../capabilities";
import { socketManager } from "../../services/socket";
import type { LogMessage } from "../../services/socket";
import type { BackendAdapter, ServiceStatusData, HealthStatusData, TypedAction, ActionResult, LogOptions, LogEntry, AuthCredentials, AuthResult, CanonicalError } from "../types";
import { installDemoInterceptor } from "../../demo/demo-interceptor";
import { normalizeStatus, normalizeError } from "./utils";
import { CONTAINER_ACTIONS } from "./actions";

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
    this.httpClient = axios.create({
      baseURL: binding.baseUrl || "/",
      timeout: 300000,
      headers: { "Content-Type": "application/json" },
      withCredentials: true,
    });
    installDemoInterceptor(this.httpClient);
    this.httpClient.interceptors.request.use((config) => {
      if (this._authToken) config.headers.Authorization = `Bearer ${this._authToken}`;
      return config;
    });
    this.httpClient.interceptors.response.use(
      (response) => response,
      (error) => {
        const canonical = normalizeError(error);
        if (canonical === "auth_expired") this._notifyAuthExpired();
        return Promise.reject(error);
      },
    );
  }

  async connect(): Promise<void> {
    this._connectionState = "connecting";
    try {
      await this.httpClient.get(this.binding.healthEndpoint ?? "/health", { timeout: 5_000 });
      this._connectionState = "connected";
    } catch {
      this._connectionState = "disconnected";
    }
  }

  disconnect(): void { this._connectionState = "disconnected"; }
  getConnectionState(): ConnectionState { return this._connectionState; }

  async discoverCapabilities(): Promise<CapabilityManifest> {
    const manifest = staticCapabilityManifests["asa-control-api"];
    if (manifest) return { ...manifest, generatedAt: Date.now() };
    return { backendId: this.backendId, capabilities: [], version: 0, generatedAt: Date.now() };
  }

  async listServices(): Promise<ServiceEntry[]> {
    const [containersRes, nativeServersRes] = await Promise.all([
      this.httpClient.get<{ success: boolean; containers?: unknown[] }>("/api/containers").catch(() => ({ data: { containers: [] } })),
      this.httpClient.get<{ success: boolean; servers?: unknown[] }>("/api/native-servers").catch(() => ({ data: { servers: [] } })),
    ]);
    const containers = (containersRes.data.containers ?? []).map((c: any) => this._toServiceEntry(c, "container"));
    const nativeServers = (nativeServersRes.data.servers ?? []).map((s: any) => this._toServiceEntry(s, "native-server"));
    const merged = new Map<string, ServiceEntry>();
    for (const svc of nativeServers) merged.set(svc.serviceId, svc);
    for (const svc of containers) { if (!merged.has(svc.serviceId)) merged.set(svc.serviceId, svc); }
    return Array.from(merged.values());
  }

  async getService(serviceId: string): Promise<ServiceEntry> {
    const localId = serviceId.includes(":") ? serviceId.split(":").pop()! : serviceId;
    try {
      const nativeRes = await this.httpClient.get<{ success: boolean; servers?: unknown[] }>("/api/native-servers");
      const found = (nativeRes.data.servers ?? []).find((s: any) => s.name === localId);
      if (found) return this._toServiceEntry(found as Record<string, unknown>, "native-server");
    } catch { /* fall through */ }
    const containerRes = await this.httpClient.get<{ success: boolean; containers?: unknown[] }>("/api/containers");
    const found = (containerRes.data.containers ?? []).find((c: any) => c.name === localId);
    if (found) return this._toServiceEntry(found as Record<string, unknown>, "container");
    throw Object.assign(new Error(`Service not found: ${localId}`), { canonicalCode: "not_found" });
  }

  async getServiceStatus(serviceId: string): Promise<ServiceStatusData> {
    const localId = serviceId.includes(":") ? serviceId.split(":").pop()! : serviceId;
    try {
      const res = await this.httpClient.get<{ success: boolean; running: boolean }>(`/api/containers/${encodeURIComponent(localId)}/running`);
      const status = normalizeStatus(res.data.running);
      return { serviceId, status, statusRaw: String(res.data.running), lastCheckedAt: Date.now(), source: "backend" };
    } catch { /* fall through */ }
    try {
      const res = await this.httpClient.get<{ success: boolean; status?: { status: string; players?: { online: number; max: number }; performance?: { cpu?: number; memory?: number; uptime?: number } } }>(`/api/native-servers/${encodeURIComponent(localId)}/status`);
      const statusData = res.data.status;
      const status = normalizeStatus(statusData?.status);
      return { serviceId, status, statusRaw: statusData?.status, players: statusData?.players?.online, cpu: statusData?.performance?.cpu, memory: statusData?.performance?.memory ? { used: statusData.performance.memory, total: 0 } : undefined, uptime: statusData?.performance?.uptime, lastCheckedAt: Date.now(), source: "backend" };
    } catch {
      return { serviceId, status: "unknown", lastCheckedAt: Date.now(), source: "cache" };
    }
  }

  async getServiceHealth(serviceId: string): Promise<HealthStatusData> {
    try {
      const statusData = await this.getServiceStatus(serviceId);
      return { serviceId, health: statusData.status === "running" ? "healthy" : "unhealthy", lastCheckedAt: Date.now() };
    } catch {
      return { serviceId, health: "unknown", lastCheckedAt: Date.now() };
    }
  }

  async executeAction(serviceId: string, action: TypedAction): Promise<ActionResult> {
    const localId = serviceId.includes(":") ? serviceId.split(":").pop()! : serviceId;
    const completedAt = Date.now();
    try {
      switch (action.actionId) {
        case "start": {
          const startRes = await this.httpClient.post<{ success: boolean; message?: string }>(`/api/containers/${encodeURIComponent(localId)}/start`);
          return { actionId: action.actionId, success: startRes.data.success, message: startRes.data.message ?? `Server "${localId}" started`, completedAt };
        }
        case "stop": {
          const stopRes = await this.httpClient.post<{ success: boolean; message?: string }>(`/api/containers/${encodeURIComponent(localId)}/stop`);
          return { actionId: action.actionId, success: stopRes.data.success, message: stopRes.data.message ?? `Server "${localId}" stopped`, completedAt };
        }
        case "restart": {
          const restartRes = await this.httpClient.post<{ success: boolean; message?: string }>(`/api/containers/${encodeURIComponent(localId)}/restart`);
          return { actionId: action.actionId, success: restartRes.data.success, message: restartRes.data.message ?? `Server "${localId}" restart initiated`, completedAt };
        }
        default:
          return { actionId: action.actionId, success: false, message: `Action "${action.actionId}" is not supported by the ASA backend`, error: "unknown", completedAt };
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      return { actionId: action.actionId, success: false, message: err.response?.data?.message ?? err.message ?? "Action failed", error: normalizeError(error), completedAt };
    }
  }

  async getAvailableActions(_serviceId: string): Promise<TypedAction[]> { return [...CONTAINER_ACTIONS]; }

  async getLogs(serviceId: string, options?: LogOptions): Promise<LogEntry[]> {
    const localId = serviceId.includes(":") ? serviceId.split(":").pop()! : serviceId;
    const params: Record<string, string | number> = {};
    if (options?.tail) params.tail = options.tail;
    if (options?.since) params.since = options.since;
    if (options?.filter) params.filter = options.filter;
    try {
      const res = await this.httpClient.get<{ success: boolean; content?: string; lines?: { timestamp?: string; level?: string; message?: string }[] }>(`/api/containers/${encodeURIComponent(localId)}/logs`, { params });
      if (res.data.lines) return res.data.lines.map((line) => ({ timestamp: line.timestamp ? new Date(line.timestamp).getTime() : Date.now(), level: (line.level as LogEntry["level"]) ?? "info", message: line.message ?? "", source: localId }));
      const content = res.data.content ?? "";
      return content.split("\n").filter(Boolean).map((line: string) => ({ timestamp: Date.now(), level: "info" as const, message: line, source: localId, raw: line }));
    } catch { return []; }
  }

  streamLogs(serviceId: string, callback: (entry: LogEntry) => void): () => void {
    const localId = serviceId.includes(":") ? serviceId.split(":").pop()! : serviceId;
    socketManager.connect(localId).catch(() => {});
    const handleLog = (data: LogMessage) => {
      callback({ timestamp: data.timestamp ? new Date(data.timestamp).getTime() : Date.now(), level: data.level, message: data.message, source: data.container ?? localId });
    };
    socketManager.onContainerLog(handleLog);
    return () => { socketManager.offContainerLog(); };
  }

  async getConfig(serviceId: string): Promise<string> {
    const localId = serviceId.includes(":") ? serviceId.split(":").pop()! : serviceId;
    const res = await this.httpClient.get<{ success: boolean; content: string }>(`/api/configs/GameUserSettings/${encodeURIComponent(localId)}`);
    return res.data.content;
  }

  async updateConfig(serviceId: string, content: string): Promise<void> {
    const localId = serviceId.includes(":") ? serviceId.split(":").pop()! : serviceId;
    await this.httpClient.post(`/api/configs/GameUserSettings/${encodeURIComponent(localId)}`, { content });
  }

  async authenticate(credentials: AuthCredentials): Promise<AuthResult> {
    try {
      const res = await this.httpClient.post<{ success: boolean; token?: string; user?: { username: string; role?: string }; message?: string }>("/api/auth/login", { username: credentials.username, password: credentials.password });
      if (res.data.success && res.data.token) {
        this._authToken = res.data.token;
        localStorage.setItem("auth_token", res.data.token);
        this._setupExpiryFromToken(res.data.token);
        return { success: true, token: res.data.token, user: res.data.user ? { id: res.data.user.username, username: res.data.user.username, roles: res.data.user.role ? [res.data.user.role] : [] } : undefined };
      }
      return { success: false, error: res.data.message ?? "Authentication failed" };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      return { success: false, error: err.response?.data?.message ?? err.message ?? "Authentication failed" };
    }
  }

  isAuthenticated(): boolean {
    if (!this._authToken) return false;
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
    } catch { return !!this._authToken; }
  }

  getAuthToken(): string | null { return this._authToken ?? localStorage.getItem("auth_token"); }

  onAuthExpired(callback: () => void): void { this._expiredCallbacks.push(callback); }

  private _notifyAuthExpired(): void {
    this._authToken = null;
    localStorage.removeItem("auth_token");
    for (const cb of this._expiredCallbacks) cb();
  }

  private _setupExpiryFromToken(token: string): void {
    try {
      const payload = token.split(".")[1];
      if (!payload) return;
      const decoded = JSON.parse(atob(payload));
      if (decoded.exp) {
        const expiresIn = decoded.exp * 1000 - Date.now();
        if (expiresIn > 0) {
          if (this._authExpiryTimer) clearTimeout(this._authExpiryTimer);
          this._authExpiryTimer = setTimeout(() => this._notifyAuthExpired(), expiresIn);
        }
      }
    } catch { /* ignore */ }
  }

  private _toServiceEntry(raw: Record<string, unknown>, sourceType: "container" | "native-server"): ServiceEntry {
    const name = String(raw.name ?? "unknown");
    return {
      serviceId: `${this.backendId}:${name}`,
      environmentId: this._environmentId ?? "unknown",
      name,
      kind: "game-server",
      runtimeOwner: sourceType === "container" ? "compose" : "manual",
      lifecycleState: "active",
      status: normalizeStatus(String(raw.status ?? "unknown")),
      health: "unknown",
      ports: [],
      tags: [],
      backendId: this.backendId,
      displayName: name,
      serviceType: sourceType === "container" ? "container" : "native-server",
      metadata: { ...raw, sourceType },
    };
  }

  destroy(): void {
    if (this._authExpiryTimer) {
      clearTimeout(this._authExpiryTimer);
      this._authExpiryTimer = null;
    }
    this._expiredCallbacks = [];
    this._authToken = null;
    this._connectionState = "disconnected";
  }
}
