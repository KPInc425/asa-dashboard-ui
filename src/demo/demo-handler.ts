/**
 * Demo Mode Request Handler
 *
 * Lazily-loaded module that processes matched API routes and returns mock data.
 * This module is NOT imported at app boot — it's loaded only on the first
 * demo-mode Axios request, avoiding any circular dependency issues.
 */

import type { AxiosRequestConfig, AxiosResponse } from "axios";
import {
  getDemoServers,
  getDemoSystemInfo,
  getDemoClusters,
  getDemoServerStatus,
  getDemoConfigFile,
  getDemoGlobalConfigs,
  getDemoSystemLogs,
  getDemoServerLogs,
  getDemoDiscordConfig,
  getDemoAutoUpdateConfig,
  getDemoModsOverview,
  getDemoSaveFiles,
  getDemoLockStatus,
  getDemoRconResponse,
  getDemoStartBat,
  getDemoArkConfigFile,
} from "./demo-data";

type MockHandler = (url: string, method: string, data?: unknown) => unknown;

function extractName(url: string, pattern: RegExp, group: number = 1): string {
  const m = url.match(pattern);
  return m ? decodeURIComponent(m[group]) : "";
}

const MOCK_ROUTES: { pattern: RegExp; handler: MockHandler }[] = [
  // Health / Auth
  {
    pattern: /\/health$/,
    handler: () => ({ status: "ok", timestamp: new Date().toISOString() }),
  },
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

  // Lock
  { pattern: /\/api\/lock-status$/, handler: () => getDemoLockStatus() },
  { pattern: /\/api\/lock\/([^/]+)$/, handler: () => getDemoLockStatus() },

  // System info
  { pattern: /\/api\/system\/info$/, handler: () => getDemoSystemInfo() },
  {
    pattern: /\/api\/provisioning\/system-info$/,
    handler: () => getDemoSystemInfo(),
  },
  {
    pattern: /\/api\/provisioning\/debug$/,
    handler: () => ({
      success: true,
      debug: {
        mode: "demo",
        mockData: true,
        timestamp: new Date().toISOString(),
      },
    }),
  },

  // Containers
  {
    pattern: /\/api\/containers$/,
    handler: () => ({ success: true, containers: getDemoServers().containers }),
  },
  {
    pattern: /\/api\/containers\/([^/]+)\/(start|stop|restart)$/,
    handler: () => ({
      success: true,
      message: "Container operation completed (demo)",
    }),
  },
  {
    pattern: /\/api\/containers\/([^/]+)\/rcon$/,
    handler: (_u, _m, d) => {
      const cmd = (d as { command?: string })?.command || "";
      return {
        success: true,
        response: getDemoRconResponse(cmd),
        message: "Demo RCON response",
      };
    },
  },
  {
    pattern: /\/api\/containers\/([^/]+)\/status$/,
    handler: (url) =>
      getDemoServerStatus(extractName(url, /\/containers\/([^/]+)\/status/)),
  },
  {
    pattern: /\/api\/containers\/([^/]+)\/running$/,
    handler: (url) => {
      const s = getDemoServerStatus(
        extractName(url, /\/containers\/([^/]+)\/running/),
      );
      return { success: true, running: s.status.status === "running" };
    },
  },
  {
    pattern: /\/api\/containers\/([^/]+)\/logs$/,
    handler: (url) =>
      getDemoServerLogs(extractName(url, /\/containers\/([^/]+)\/logs/)),
  },

  // Native Servers
  {
    pattern: /\/api\/native-servers$/,
    handler: () => ({ success: true, servers: getDemoServers().nativeServers }),
  },
  {
    pattern: /\/api\/native-servers\/([^/]+)\/status$/,
    handler: (url) =>
      getDemoServerStatus(
        extractName(url, /\/native-servers\/([^/]+)\/status/),
      ),
  },
  {
    pattern: /\/api\/native-servers\/([^/]+)\/running$/,
    handler: (url) => {
      const s = getDemoServerStatus(
        extractName(url, /\/native-servers\/([^/]+)\/running/),
      );
      return { success: true, running: s.status.status === "running" };
    },
  },
  {
    pattern: /\/api\/native-servers\/([^/]+)\/(start|stop|restart)$/,
    handler: () => ({
      success: true,
      message: "Native server operation completed (demo)",
    }),
  },
  {
    pattern: /\/api\/native-servers\/([^/]+)\/rcon$/,
    handler: (_u, _m, d) => {
      const cmd = (d as { command?: string })?.command || "";
      return {
        success: true,
        response: getDemoRconResponse(cmd),
        message: "Demo RCON response",
      };
    },
  },
  {
    pattern: /\/api\/native-servers\/([^/]+)\/logs$/,
    handler: (url) =>
      getDemoServerLogs(extractName(url, /\/native-servers\/([^/]+)\/logs/)),
  },
  {
    pattern: /\/api\/native-servers\/([^/]+)\/log-files$/,
    handler: (url) => {
      const name = extractName(url, /\/native-servers\/([^/]+)\/log-files/);
      return {
        success: true,
        logFiles: [
          {
            name: "ShooterGame.log",
            path: `/ark/logs/${name}/ShooterGame.log`,
            size: 1048576,
            modified: new Date().toISOString(),
          },
        ],
      };
    },
  },
  {
    pattern: /\/api\/native-servers\/([^/]+)\/mods$/,
    handler: () => ({
      success: true,
      serverConfig: { additionalMods: [], excludeSharedMods: false },
    }),
  },
  {
    pattern: /\/api\/native-servers\/([^/]+)\/save-files$/i,
    handler: () => getDemoSaveFiles(),
  },
  {
    pattern: /\/api\/native-servers\/([^/]+)\/save-files\/upload$/i,
    handler: () => ({ success: true, message: "Save file uploaded (demo)" }),
  },
  {
    pattern: /\/api\/native-servers\/([^/]+)\/save-files\/download\/([^/]+)$/i,
    handler: () => ({ success: true, message: "Save file downloaded (demo)" }),
  },
  {
    pattern: /\/api\/native-servers\/([^/]+)\/save-files\/backup$/i,
    handler: () => ({ success: true, message: "Save files backed up (demo)" }),
  },
  {
    pattern: /\/api\/native-servers\/([^/]+)\/save-files\/([^/]+)$/i,
    handler: () => ({ success: true, message: "Save file deleted (demo)" }),
  },
  {
    pattern: /\/api\/native-servers\/([^/]+)\/start-bat$/,
    handler: (url) =>
      getDemoStartBat(extractName(url, /\/native-servers\/([^/]+)\/start-bat/)),
  },
  {
    pattern: /\/api\/native-servers\/([^/]+)\/regenerate-start-bat$/,
    handler: () => ({ success: true, message: "Start.bat regenerated (demo)" }),
  },

  // Configs
  {
    pattern: /\/api\/configs\/ark\/([^/]+)\/info$/,
    handler: () => ({
      success: true,
      server: { name: "demo-server", map: "TheIsland" },
    }),
  },
  {
    pattern: /\/api\/configs\/ark\/([^/]+)\/(Game\.ini|GameUserSettings\.ini)$/,
    handler: (url) => {
      const p = url.split("/");
      return getDemoArkConfigFile(
        decodeURIComponent(p[p.length - 2]),
        p[p.length - 1] as "Game.ini" | "GameUserSettings.ini",
      );
    },
  },
  {
    pattern: /\/api\/configs\/([^/]+)$/,
    handler: (url) =>
      getDemoConfigFile(
        extractName(url, /\/configs\/([^/]+)$/),
        "GameUserSettings.ini",
      ),
  },
  {
    pattern: /\/api\/configs$/,
    handler: () => {
      const all = [
        ...getDemoServers().containers,
        ...getDemoServers().nativeServers,
      ];
      return {
        success: true,
        servers: all.map((s) => s.name),
        count: all.length,
        rootPath: "D:\\ARK\\Configs",
      };
    },
  },

  // Server info (api-config.ts)
  {
    pattern: /\/api\/servers\/([^/]+)\/config\/files$/,
    handler: () => ({
      success: true,
      files: ["GameUserSettings.ini", "Game.ini"],
      serverName: "demo-server",
      path: "D:\\ARK\\Configs",
      defaultFiles: ["GameUserSettings.ini", "Game.ini"],
    }),
  },
  {
    pattern: /\/api\/servers\/([^/]+)\/config$/,
    handler: (url) => {
      const name = extractName(url, /\/api\/servers\/([^/]+)\/config/);
      const r = getDemoConfigFile(name, "GameUserSettings.ini");
      return {
        success: true,
        content: r.content,
        filePath: r.filePath,
        fileName: "GameUserSettings.ini",
        serverName: name,
        configPath: r.configPath,
      };
    },
  },
  {
    pattern: /\/api\/servers\/([^/]+)$/,
    handler: (url) => {
      const name = extractName(url, /\/api\/servers\/([^/]+)/);
      const all = [
        ...getDemoServers().containers,
        ...getDemoServers().nativeServers,
      ];
      const sv = all.find((s) => s.name === name);
      return {
        success: true,
        name: sv?.name || name,
        map: sv?.map || "TheIsland",
        status: sv?.status || "unknown",
        configPath: `/ark/config/${name}`,
      };
    },
  },
  {
    pattern: /\/api\/servers$/,
    handler: () => {
      const all = [
        ...getDemoServers().containers,
        ...getDemoServers().nativeServers,
      ];
      return {
        success: true,
        servers: all.map((s) => s.name),
        count: all.length,
        rootPath: "D:\\ARK\\Servers",
      };
    },
  },

  // Logs
  {
    pattern: /\/api\/provisioning\/system-logs$/,
    handler: () => getDemoSystemLogs(),
  },
  {
    pattern: /\/api\/logs\/([^/]+)\/files\/([^/]+)$/,
    handler: (url) => {
      const name = extractName(url, /\/logs\/([^/]+)\/files\//);
      return {
        success: true,
        serverName: name,
        fileName: "ShooterGame.log",
        content: getDemoServerLogs(name).content,
        lines: 50,
      };
    },
  },
  {
    pattern: /\/api\/logs\/([^/]+)\/files$/,
    handler: (url) => {
      const name = extractName(url, /\/logs\/([^/]+)\/files/);
      return {
        success: true,
        serverName: name,
        logFiles: [
          {
            name: "ShooterGame.log",
            path: `/ark/logs/${name}/ShooterGame.log`,
            size: 1048576,
          },
        ],
      };
    },
  },
  {
    pattern: /\/api\/logs\/([^/]+)\/debug$/,
    handler: (url) => {
      const name = extractName(url, /\/logs\/([^/]+)\/debug/);
      return {
        success: true,
        serverName: name,
        logFiles: [
          {
            name: "ShooterGame.log",
            path: `/ark/logs/${name}/ShooterGame.log`,
            size: 1048576,
          },
        ],
        timestamp: new Date().toISOString(),
      };
    },
  },

  // Provisioning
  {
    pattern: /\/api\/provisioning\/global-configs$/,
    handler: () => getDemoGlobalConfigs(),
  },
  {
    pattern: /\/api\/provisioning\/shared-mods$/,
    handler: () => ({
      success: true,
      sharedMods: getDemoModsOverview().overview.sharedMods,
    }),
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
    handler: () => ({ success: true, message: "System initialized (demo)" }),
  },
  {
    pattern: /\/api\/provisioning\/find-steamcmd$/,
    handler: () => ({
      success: true,
      steamCmdPath: "C:\\SteamCMD\\steamcmd.exe",
      found: true,
    }),
  },
  {
    pattern: /\/api\/provisioning\/configure-steamcmd$/,
    handler: () => ({
      success: true,
      message: "SteamCMD configured (demo)",
      steamCmdPath: "C:\\SteamCMD\\steamcmd.exe",
      autoInstall: false,
    }),
  },
  {
    pattern: /\/api\/provisioning\/install-asa-binaries$/,
    handler: () => ({
      success: true,
      message: "ASA binaries installed (demo)",
    }),
  },
  {
    pattern: /\/api\/provisioning\/regenerate-start-scripts$/,
    handler: () => ({
      success: true,
      message: "Start scripts regenerated (demo)",
      details: { successful: [], failed: [], totalProcessed: 0 },
    }),
  },
  {
    pattern: /\/api\/provisioning\/servers\/([^/]+)\/update-config$/,
    handler: () => ({ success: true, message: "Update config saved (demo)" }),
  },
  {
    pattern: /\/api\/provisioning\/servers\/([^/]+)\/update-status$/,
    handler: () => ({
      success: true,
      data: {
        needsUpdate: false,
        reason: "Up to date",
        lastUpdate: new Date().toISOString(),
        updateEnabled: true,
      },
    }),
  },
  {
    pattern: /\/api\/provisioning\/servers\/([^/]+)\/update-with-config$/,
    handler: () => ({ success: true, message: "Server updated (demo)" }),
  },
  {
    pattern: /\/api\/provisioning\/servers\/([^/]+)\/update-settings$/,
    handler: () => ({ success: true, message: "Settings updated (demo)" }),
  },
  {
    pattern: /\/api\/provisioning\/servers\/([^/]+)\/backup$/,
    handler: () => ({
      success: true,
      message: "Server backup completed (demo)",
    }),
  },
  {
    pattern: /\/api\/provisioning\/servers\/([^/]+)\/restore$/,
    handler: () => ({ success: true, message: "Server restored (demo)" }),
  },
  {
    pattern: /\/api\/provisioning\/server-mods\/([^/]+)$/,
    handler: () => ({
      success: true,
      serverConfig: { additionalMods: [], excludeSharedMods: false },
    }),
  },
  {
    pattern: /\/api\/provisioning\/clusters\/([^/]+)\/(start|stop|restart)$/,
    handler: (url) => {
      const name = extractName(url, /\/clusters\/([^/]+)\//);
      return {
        success: true,
        message: `Cluster ${name} action completed (demo)`,
      };
    },
  },
  {
    pattern: /\/api\/provisioning\/clusters\/([^/]+)$/,
    handler: (url) => {
      const name = extractName(url, /\/clusters\/([^/]+)/);
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
    pattern: /\/api\/provisioning\/cluster-backups\/([^/]+)$/,
    handler: () => ({ success: true, data: [], message: "No backups (demo)" }),
  },
  {
    pattern: /\/api\/provisioning\/update-all-servers$/,
    handler: () => ({
      success: true,
      message: "All servers update triggered (demo)",
    }),
  },
  {
    pattern: /\/api\/provisioning\/update-all-servers-with-config$/,
    handler: () => ({
      success: true,
      message: "Update completed. Updated: 3, Skipped: 0, Failed: 0",
    }),
  },
  {
    pattern: /\/api\/provisioning\/update-status-all$/,
    handler: () => ({ success: true, data: [] }),
  },
  {
    pattern: /\/api\/provisioning\/server-backups$/,
    handler: () => ({ success: true, data: [], message: "No backups (demo)" }),
  },
  {
    pattern: /\/api\/provisioning\/servers$/,
    handler: () => ({ success: true, servers: [] }),
  },
  {
    pattern: /\/api\/provisioning\/create-server$/,
    handler: () => ({ success: true, message: "Server created (demo)" }),
  },

  // Auto-Update
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
    handler: () => ({
      success: true,
      schedulerRunning: true,
      servers: getDemoServers().containers.map((c) => ({
        serverName: c.name,
        status: "idle",
        lastCheck: new Date().toISOString(),
        nextCheck: new Date(Date.now() + 3600000).toISOString(),
        updateAvailable: c.name === "ark-fjordur",
        currentVersion: "1.0.2",
        latestVersion: c.name === "ark-fjordur" ? "1.0.3" : "1.0.2",
        enabled: true,
        schedulerActive: true,
      })),
    }),
  },
  {
    pattern: /\/api\/auto-update\/scheduler\/(start|stop)$/,
    handler: () => ({ success: true, message: "Scheduler updated (demo)" }),
  },
  {
    pattern: /\/api\/auto-update\/check-now$/,
    handler: () => ({
      success: true,
      message: "Update check triggered (demo)",
      checkedServers: 10,
    }),
  },
  {
    pattern: /\/api\/auto-update\/update-all$/,
    handler: () => ({ success: true, message: "All servers updated (demo)" }),
  },
  {
    pattern: /\/api\/auto-update\/servers\/([^/]+)\/config$/,
    handler: (url) => ({
      success: true,
      serverName: extractName(url, /\/auto-update\/servers\/([^/]+)\/config/),
      config: {
        enabled: true,
        updateOnStart: true,
        autoRestart: true,
        checkIntervalMinutes: 60,
        warningMinutes: [30, 10, 5, 1],
      },
    }),
  },
  {
    pattern: /\/api\/auto-update\/servers\/([^/]+)\/status$/,
    handler: (url) => ({
      success: true,
      serverName: extractName(url, /\/auto-update\/servers\/([^/]+)\/status/),
      status: "idle",
      updateAvailable: false,
      currentVersion: "1.0.2",
      lastCheck: new Date().toISOString(),
    }),
  },
  {
    pattern: /\/api\/auto-update\/servers\/([^/]+)\/check$/,
    handler: (url) => ({
      success: true,
      serverName: extractName(url, /\/auto-update\/servers\/([^/]+)\/check/),
      updateAvailable: false,
      currentVersion: "1.0.2",
      message: "Up to date (demo)",
    }),
  },
  {
    pattern: /\/api\/auto-update\/servers\/([^/]+)\/run-now$/,
    handler: (url) => ({
      success: true,
      serverName: extractName(url, /\/auto-update\/servers\/([^/]+)\/run-now/),
      jobId: `job-${Date.now()}`,
      message: "Update started (demo)",
    }),
  },
  {
    pattern: /\/api\/auto-update\/servers\/([^/]+)\/cancel$/,
    handler: () => ({ success: true, message: "Update cancelled (demo)" }),
  },
  {
    pattern: /\/api\/auto-update\/servers\/([^/]+)\/history$/,
    handler: () => ({ success: true, events: [] }),
  },

  // Discord
  {
    pattern: /\/api\/discord\/webhooks\/([^/]+)$/,
    handler: (_u, method) => {
      if (method === "delete")
        return { success: true, message: "Webhook deleted (demo)" };
      return { success: true, webhook: getDemoDiscordConfig().webhooks[0] };
    },
  },
  {
    pattern: /\/api\/discord\/webhooks$/,
    handler: (_u, method) => {
      if (method === "post")
        return {
          success: true,
          webhook: {
            id: `wh-demo-${Date.now()}`,
            name: "New Webhook",
            url: "https://discord.com/api/webhooks/demo/xxx",
            channel: "#general",
            enabled: true,
          },
        };
      return { success: true, webhooks: getDemoDiscordConfig().webhooks };
    },
  },
  {
    pattern: /\/api\/discord\/bot\/config$/,
    handler: (_u, method) => {
      if (method === "put")
        return { success: true, message: "Bot config updated (demo)" };
      return { success: true, config: getDemoDiscordConfig().bot };
    },
  },
  {
    pattern: /\/api\/discord\/(config|settings)$/,
    handler: () => getDemoDiscordConfig(),
  },
  {
    pattern: /\/api\/discord\/notify$/,
    handler: () => ({ success: true, message: "Notification sent (demo)" }),
  },
];

// ---------------------------------------------------------------------------
// Public handler — called by the request wrapper
// ---------------------------------------------------------------------------

/**
 * Handle an Axios request in demo mode.
 * Returns a mock AxiosResponse if the URL matches a known route,
 * or calls the original request function if no match is found.
 */
export async function handleDemoRequest(
  config: AxiosRequestConfig,
  originalRequest: (config: AxiosRequestConfig) => Promise<AxiosResponse>,
): Promise<AxiosResponse> {
  const url = typeof config.url === "string" ? config.url : "";
  const method = (config.method || "get").toLowerCase();
  let body: unknown;
  try {
    body = config.data ? JSON.parse(config.data as string) : undefined;
  } catch {
    body = config.data;
  }

  for (const route of MOCK_ROUTES) {
    if (route.pattern.test(url)) {
      const mockData = route.handler(url, method, body);
      await new Promise((r) => setTimeout(r, 80 + Math.random() * 120));
      return {
        data: mockData,
        status: 200,
        statusText: "OK (Demo)",
        headers: { "content-type": "application/json" },
        config,
        __demoHandled: true,
      } as any;
    }
  }

  // No match — passthrough to real request
  return originalRequest(config);
}
