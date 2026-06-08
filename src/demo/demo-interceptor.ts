/**
 * Demo Mode API Interceptor
 *
 * Registers a NEW response error handler that runs FIRST because it's
 * added to the END of the handlers array, and Axios iterates handlers
 * in REVERSE for error handlers (LIFO). So our handler catches errors
 * before the original error handler in api-core.ts transforms them.
 *
 * For SUCCESS responses, our handler overrides the data with mock data
 * when on /demo, regardless of what the real backend returned.
 */

import { isDemoPath } from "./demo-core";
import type { AxiosInstance, AxiosResponse, AxiosError } from "axios";

function getPath(config: any): string {
  const base = (config.baseURL || "").replace(/\/+$/, "");
  let url = (config.url || "").replace(/^\/+/, "");
  // Strip query parameters from relative URLs
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = url.split("?")[0];
  }
  if (url.startsWith("http://") || url.startsWith("https://")) {
    try {
      return new URL(url).pathname;
    } catch {
      return "/" + url;
    }
  }
  if (base.startsWith("http://") || base.startsWith("https://")) {
    try {
      return new URL(url, base).pathname;
    } catch {
      return "/" + url;
    }
  }
  return "/" + url;
}

export function installDemoInterceptor(axiosInstance: AxiosInstance): void {
  // Use plain response interceptors. With api-core.ts now passing
  // raw AxiosErrors through on /demo, our handler (registered second)
  // receives the error with config intact.

  // Success handler: override real backend data with mock data
  axiosInstance.interceptors.response.use(async (response: AxiosResponse) => {
    if (!isDemoPath()) return response;
    const config = response.config;
    if (!config) return response;
    const path = getPath(config);
    const method = (config.method || "get").toLowerCase();
    let body: unknown;
    try {
      body = config.data ? JSON.parse(config.data as string) : undefined;
    } catch {
      body = config.data;
    }
    const mockData = getMockData(path, method, body);
    if (mockData === undefined) return response;
    response.data = mockData;
    response.status = 200;
    response.statusText = "OK (Demo)";
    return response;
  });

  // Error handler: catch errors and return mock data when on /demo
  axiosInstance.interceptors.response.use(
    undefined,
    async (error: AxiosError) => {
      if (!isDemoPath()) return Promise.reject(error);
      const config = error.config;
      if (!config) return Promise.reject(error);
      const path = getPath(config);
      const method = (config.method || "get").toLowerCase();
      let body: unknown;
      try {
        body = config.data ? JSON.parse(config.data as string) : undefined;
      } catch {
        body = config.data;
      }
      const mockData = getMockData(path, method, body);
      if (mockData === undefined) return Promise.reject(error);
      return {
        data: mockData,
        status: 200,
        statusText: "OK (Demo)",
        headers: {},
        config,
      } as AxiosResponse;
    },
  );
}

// =========================================================================
// Mock data registry
// =========================================================================

import {
  getDemoServers,
  getDemoSystemInfo,
  getDemoClusters,
  getDemoServerStatus,
  getDemoGlobalConfigs,
  getDemoSystemLogs,
  getDemoServerLogs,
  getDemoDiscordConfig,
  getDemoAutoUpdateConfig,
  getDemoModsOverview,
  getDemoSaveFiles,
  getDemoLockStatus,
  getDemoRconResponse,
} from "./demo-data";

type MockHandler = (path: string, method: string, body?: unknown) => unknown;
interface MockRoute {
  pattern: RegExp;
  handler: MockHandler;
}

const NOW = new Date().toISOString();
const DAYS_AGO = (n: number) =>
  new Date(Date.now() - n * 86400000).toISOString();

const DEMO_USERS = [
  {
    id: "1",
    username: "admin",
    email: "admin@example.com",
    role: "admin",
    permissions: ["read", "write", "admin", "user_management"],
    profile: {
      firstName: "Admin",
      lastName: "User",
      displayName: "Administrator",
      avatar: null,
      timezone: "UTC",
      language: "en",
    },
    security: { emailVerified: true, twoFactorEnabled: false, lastLogin: NOW },
    metadata: { createdAt: DAYS_AGO(30), lastActivity: NOW },
  },
  {
    id: "2",
    username: "moderator",
    email: "mod@example.com",
    role: "moderator",
    permissions: ["read"],
    profile: {
      firstName: "Mod",
      lastName: "User",
      displayName: "Moderator",
      avatar: null,
      timezone: "UTC",
      language: "en",
    },
    security: {
      emailVerified: true,
      twoFactorEnabled: false,
      lastLogin: DAYS_AGO(1),
    },
    metadata: { createdAt: DAYS_AGO(14), lastActivity: DAYS_AGO(1) },
  },
  {
    id: "3",
    username: "serverop",
    email: "op@example.com",
    role: "operator",
    permissions: ["read", "write"],
    profile: {
      firstName: "Server",
      lastName: "Operator",
      displayName: "Server Operator",
      avatar: null,
      timezone: "America/New_York",
      language: "en",
    },
    security: {
      emailVerified: true,
      twoFactorEnabled: true,
      lastLogin: DAYS_AGO(2),
    },
    metadata: { createdAt: DAYS_AGO(20), lastActivity: DAYS_AGO(2) },
  },
];

const ROUTES: MockRoute[] = [
  { pattern: /\/health$/, handler: () => ({ status: "ok" }) },
  {
    pattern: /\/api\/auth\/me$/,
    handler: () => ({
      success: true,
      user: {
        username: "Demo Viewer",
        role: "admin",
        permissions: ["read", "write", "admin", "user_management"],
      },
    }),
  },
  {
    pattern: /\/api\/auth\/login$/,
    handler: () => ({
      success: true,
      token: "demo-token",
      user: {
        username: "Demo Viewer",
        role: "admin",
        permissions: ["read", "write", "admin", "user_management"],
      },
    }),
  },
  {
    pattern: /\/api\/auth\/users\/[^/]+$/,
    handler: (_p, method) => ({
      success: true,
      message:
        method === "delete" ? "User deleted (demo)" : "User updated (demo)",
    }),
  },
  {
    pattern: /\/api\/auth\/users$/,
    handler: (_p, method) => {
      if (method === "get") return { success: true, users: DEMO_USERS };
      return {
        success: true,
        message: "User created (demo)",
        user: { id: "4", username: "newuser", role: "user", permissions: [] },
      };
    },
  },
  { pattern: /\/api\/lock-status$/, handler: () => getDemoLockStatus() },
  { pattern: /\/api\/lock\//, handler: () => getDemoLockStatus() },
  { pattern: /\/api\/system\/info$/, handler: () => getDemoSystemInfo() },
  {
    pattern: /\/api\/provisioning\/system-info$/,
    handler: () => getDemoSystemInfo(),
  },
  {
    pattern: /\/api\/provisioning\/debug$/,
    handler: () => ({ success: true, debug: { mode: "demo" } }),
  },
  {
    pattern: /\/api\/environment/,
    handler: () => ({
      success: true,
      content: "# Demo\nVITE_API_URL=",
      variables: { VITE_API_URL: "" },
      path: ".env",
    }),
  },
  {
    pattern: /\/api\/environment\/[^/]+$/,
    handler: () => ({
      success: true,
      message: "Environment variable updated (demo)",
      path: ".env",
      variables: {},
    }),
  },
  {
    pattern: /\/api\/docker-compose/,
    handler: () => ({
      success: true,
      content: "version: '3'\n",
      path: "docker-compose.yml",
    }),
  },
  {
    pattern: /\/api\/ark-servers/,
    handler: () => ({ success: true, servers: [], count: 0 }),
  },
  { pattern: /\/api\/mods$/, handler: () => ({ success: true, mods: [] }) },
  {
    pattern: /\/api\/containers$/,
    handler: () => ({ success: true, containers: getDemoServers().containers }),
  },
  {
    pattern: /\/api\/containers\/([^/]+)\/(start|stop|restart)$/,
    handler: () => ({ success: true, message: "Container operation (demo)" }),
  },
  {
    pattern: /\/api\/containers\/([^/]+)\/rcon$/,
    handler: (_p, _m, d) => ({
      success: true,
      response: getDemoRconResponse((d as any)?.command || ""),
      message: "RCON (demo)",
    }),
  },
  {
    pattern: /\/api\/containers\/([^/]+)\/status$/,
    handler: (p) => {
      const m = p.match(/\/containers\/([^/]+)\/status/);
      return getDemoServerStatus(m?.[1] ?? "");
    },
  },
  {
    pattern: /\/api\/containers\/([^/]+)\/running$/,
    handler: (p) => {
      const m = p.match(/\/containers\/([^/]+)\/running/);
      const s = getDemoServerStatus(m?.[1] ?? "");
      return { success: true, running: s.status.status === "running" };
    },
  },
  {
    pattern: /\/api\/containers\/([^/]+)\/logs$/,
    handler: (p) => {
      const m = p.match(/\/containers\/([^/]+)\/logs/);
      return getDemoServerLogs(m?.[1] ?? "");
    },
  },
  {
    pattern: /\/api\/native-servers$/,
    handler: () => ({ success: true, servers: getDemoServers().nativeServers }),
  },
  {
    pattern: /\/api\/native-servers\/([^/]+)\/status$/,
    handler: (p) => {
      const m = p.match(/\/native-servers\/([^/]+)\/status/);
      return getDemoServerStatus(m?.[1] ?? "");
    },
  },
  {
    pattern: /\/api\/native-servers\/([^/]+)\/running$/,
    handler: (p) => {
      const m = p.match(/\/native-servers\/([^/]+)\/running/);
      const s = getDemoServerStatus(m?.[1] ?? "");
      return { success: true, running: s.status.status === "running" };
    },
  },
  {
    pattern: /\/api\/native-servers\/([^/]+)\/(start|stop|restart)$/,
    handler: () => ({ success: true, message: "Operation (demo)" }),
  },
  {
    pattern: /\/api\/native-servers\/([^/]+)\/rcon$/,
    handler: (_p, _m, d) => ({
      success: true,
      response: getDemoRconResponse((d as any)?.command || ""),
      message: "RCON (demo)",
    }),
  },
  {
    pattern: /\/api\/native-servers\/([^/]+)\/logs$/,
    handler: (p) => {
      const m = p.match(/\/native-servers\/([^/]+)\/logs/);
      return getDemoServerLogs(m?.[1] ?? "");
    },
  },
  {
    pattern: /\/api\/native-servers\/([^/]+)\/log-files$/,
    handler: () => ({ success: true, logFiles: [] }),
  },
  {
    pattern: /\/api\/native-servers\/([^/]+)\/mods$/,
    handler: () => ({
      success: true,
      serverConfig: { additionalMods: [], excludeSharedMods: false },
    }),
  },
  {
    pattern: /\/api\/native-servers\/([^/]+)\/save-files/i,
    handler: () => getDemoSaveFiles(),
  },
  {
    pattern: /\/api\/native-servers\/([^/]+)\/start-bat$/,
    handler: () => ({
      success: true,
      content: "@echo off\ncls\necho Demo",
      path: "D:\\ARK\\start.bat",
    }),
  },
  {
    pattern: /\/api\/configs\/ark\/([^/]+)\/info$/,
    handler: () => ({
      success: true,
      server: { name: "demo", map: "TheIsland" },
    }),
  },
  {
    pattern: /\/api\/configs\/ark\//,
    handler: () => ({
      success: true,
      content: "[ServerSettings]\nMaxPlayers=70\n",
      path: "D:\\ARK\\Configs",
    }),
  },
  {
    pattern: /\/api\/configs\/([^/]+)$/,
    handler: () => ({
      success: true,
      content: "[ServerSettings]\nMaxPlayers=70\n",
      filename: "GameUserSettings.ini",
      map: "TheIsland",
      configPath: "D:\\ARK\\Configs",
      filePath: "D:\\ARK\\Configs\\GameUserSettings.ini",
      fileName: "GameUserSettings.ini",
      serverName: "demo",
    }),
  },
  {
    pattern: /\/api\/configs$/,
    handler: () => ({
      success: true,
      servers: [],
      count: 0,
      rootPath: "D:\\ARK",
    }),
  },
  {
    pattern: /\/api\/servers\/([^/]+)\/config\/files$/,
    handler: () => ({
      success: true,
      files: ["GameUserSettings.ini", "Game.ini"],
      serverName: "demo",
      path: "D:\\ARK\\Configs",
      defaultFiles: ["GameUserSettings.ini", "Game.ini"],
    }),
  },
  {
    pattern: /\/api\/servers\/([^/]+)\/config$/,
    handler: (p) => ({
      success: true,
      content: "[ServerSettings]\nMaxPlayers=70\n",
      filePath: "D:\\ARK\\Configs\\GameUserSettings.ini",
      fileName: "GameUserSettings.ini",
      serverName: p.match(/\/api\/servers\/([^/]+)\/config/)?.[1] ?? "demo",
      configPath: "D:\\ARK\\Configs",
    }),
  },
  {
    pattern: /\/api\/servers\/([^/]+)$/,
    handler: (p) => ({
      success: true,
      name: p.match(/\/api\/servers\/([^/]+)/)?.[1] ?? "demo",
      map: "TheIsland",
      status: "running",
      configPath: "D:\\ARK\\Configs",
    }),
  },
  {
    pattern: /\/api\/servers$/,
    handler: () => ({
      success: true,
      servers: [],
      count: 0,
      rootPath: "D:\\ARK",
    }),
  },
  {
    pattern: /\/api\/provisioning\/global-configs$/,
    handler: () => getDemoGlobalConfigs(),
  },
  {
    pattern: /\/api\/provisioning\/shared-mods$/,
    handler: () => ({ success: true, sharedMods: [] }),
  },
  {
    pattern: /\/api\/provisioning\/mods-overview$/,
    handler: () => getDemoModsOverview(),
  },
  {
    pattern: /\/api\/provisioning\/config-exclusions$/,
    handler: () => ({ success: true, excludedServers: [] }),
  },
  {
    pattern: /\/api\/provisioning\/initialize$/,
    handler: () => ({ success: true, message: "Initialized (demo)" }),
  },
  {
    pattern: /\/api\/provisioning\/find-steamcmd$/,
    handler: () => ({
      success: true,
      found: true,
      steamCmdPath: "C:\\SteamCMD",
    }),
  },
  {
    pattern: /\/api\/provisioning\/configure-steamcmd$/,
    handler: () => ({ success: true, message: "Configured (demo)" }),
  },
  {
    pattern: /\/api\/provisioning\/install-asa-binaries$/,
    handler: () => ({ success: true, message: "Installed (demo)" }),
  },
  {
    pattern: /\/api\/provisioning\/regenerate-start-scripts$/,
    handler: () => ({ success: true, message: "Regenerated (demo)" }),
  },
  {
    pattern: /\/api\/provisioning\/system-logs$/,
    handler: () => getDemoSystemLogs(),
  },
  {
    pattern: /\/api\/provisioning\/server-mods\//,
    handler: () => ({
      success: true,
      serverConfig: { additionalMods: [], excludeSharedMods: false },
    }),
  },
  {
    pattern: /\/api\/provisioning\/servers\//,
    handler: () => ({ success: true, message: "Server operation (demo)" }),
  },
  {
    pattern: /\/api\/provisioning\/clusters\/([^/]+)\/(start|stop|restart)$/,
    handler: () => ({ success: true, message: "Cluster action (demo)" }),
  },
  {
    pattern: /\/api\/provisioning\/clusters\/([^/]+)$/,
    handler: (p) => {
      const m = p.match(/\/clusters\/([^/]+)/);
      const name = m?.[1] ?? "";
      const clusters = getDemoClusters();
      return {
        success: true,
        cluster: clusters.find((c) => c.name === name) || clusters[0],
      };
    },
  },
  {
    pattern: /\/api\/provisioning\/clusters$/,
    handler: () => ({ success: true, clusters: getDemoClusters() }),
  },
  {
    pattern: /\/api\/provisioning\/cluster-backups\//,
    handler: () => ({ success: true, data: [] }),
  },
  {
    pattern: /\/api\/provisioning\/update-all-servers/,
    handler: () => ({ success: true, message: "Updated (demo)" }),
  },
  {
    pattern: /\/api\/provisioning\/update-status-all$/,
    handler: () => ({ success: true, data: [] }),
  },
  {
    pattern: /\/api\/provisioning\/server-backups$/,
    handler: () => ({ success: true, data: [] }),
  },
  {
    pattern: /\/api\/provisioning\/create-server$/,
    handler: () => ({ success: true, message: "Created (demo)" }),
  },
  {
    pattern: /\/api\/logs\//,
    handler: () => ({
      success: true,
      content: "[INFO] Demo log\n",
      logFiles: [],
    }),
  },
  {
    pattern: /\/api\/auto-update\/config$/,
    handler: () => getDemoAutoUpdateConfig(),
  },
  {
    pattern: /\/api\/auto-shutdown\/config$/,
    handler: () => getDemoAutoUpdateConfig(),
  },
  {
    pattern: /\/api\/auto-update\/status$/,
    handler: () => ({ success: true, schedulerRunning: true, servers: [] }),
  },
  {
    pattern: /\/api\/auto-update\//,
    handler: () => ({ success: true, message: "Auto-update (demo)" }),
  },
  {
    pattern: /\/api\/discord\/webhooks$/,
    handler: () => ({
      success: true,
      webhooks: getDemoDiscordConfig().webhooks,
    }),
  },
  {
    pattern: /\/api\/discord\/webhooks\//,
    handler: () => ({ success: true, message: "Webhook (demo)" }),
  },
  {
    pattern: /\/api\/discord\/bot\/config$/,
    handler: () => ({ success: true, config: getDemoDiscordConfig().bot }),
  },
  {
    pattern: /\/api\/discord\/(config|settings)$/,
    handler: () => getDemoDiscordConfig(),
  },
  {
    pattern: /\/api\/discord\/notify$/,
    handler: () => ({ success: true, message: "Sent (demo)" }),
  },
];

function getMockData(path: string, method: string, body?: unknown): unknown {
  const np = path.startsWith("/") ? path : "/" + path;
  for (const r of ROUTES) {
    if (r.pattern.test(np)) return r.handler(np, method, body);
  }
  return undefined;
}
