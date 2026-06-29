import {
  getDemoServers, getDemoSystemInfo, getDemoClusters, getDemoServerStatus,
  getDemoGlobalConfigs, getDemoSystemLogs, getDemoServerLogs, getDemoDiscordConfig,
  getDemoAutoUpdateConfig, getDemoModsOverview, getDemoSaveFiles, getDemoLockStatus,
  getDemoRconResponse,
} from "../demo-data";

type MockHandler = (path: string, method: string, body?: unknown) => unknown;
interface MockRoute { pattern: RegExp; handler: MockHandler; }

const NOW = new Date().toISOString();
const DAYS_AGO = (n: number) => new Date(Date.now() - n * 86400000).toISOString();

const DEMO_USERS = [
  { id: "1", username: "admin", email: "admin@example.com", role: "admin", permissions: ["read", "write", "admin", "user_management"], profile: { firstName: "Admin", lastName: "User", displayName: "Administrator", avatar: null, timezone: "UTC", language: "en" }, security: { emailVerified: true, twoFactorEnabled: false, lastLogin: NOW }, metadata: { createdAt: DAYS_AGO(30), lastActivity: NOW } },
  { id: "2", username: "moderator", email: "mod@example.com", role: "moderator", permissions: ["read"], profile: { firstName: "Mod", lastName: "User", displayName: "Moderator", avatar: null, timezone: "UTC", language: "en" }, security: { emailVerified: true, twoFactorEnabled: false, lastLogin: DAYS_AGO(1) }, metadata: { createdAt: DAYS_AGO(14), lastActivity: DAYS_AGO(1) } },
  { id: "3", username: "serverop", email: "op@example.com", role: "operator", permissions: ["read", "write"], profile: { firstName: "Server", lastName: "Operator", displayName: "Server Operator", avatar: null, timezone: "America/New_York", language: "en" }, security: { emailVerified: true, twoFactorEnabled: true, lastLogin: DAYS_AGO(2) }, metadata: { createdAt: DAYS_AGO(20), lastActivity: DAYS_AGO(2) } },
];

const ROUTES: MockRoute[] = [
  { pattern: /\/health$/, handler: () => ({ status: "ok" }) },
  { pattern: /\/api\/auth\/me$/, handler: () => ({ success: true, user: { username: "Demo Viewer", role: "admin", permissions: ["read", "write", "admin", "user_management"] } }) },
  { pattern: /\/api\/auth\/login$/, handler: () => ({ success: true, token: "demo-token", user: { username: "Demo Viewer", role: "admin", permissions: ["read", "write", "admin", "user_management"] } }) },
  { pattern: /\/api\/auth\/users\/[^/]+$/, handler: (_p, method) => ({ success: true, message: method === "delete" ? "User deleted (demo)" : "User updated (demo)" }) },
  { pattern: /\/api\/auth\/users$/, handler: (_p, method) => method === "get" ? { success: true, users: DEMO_USERS } : { success: true, message: "User created (demo)", user: { id: "4", username: "newuser", role: "user", permissions: [] } } },
  { pattern: /\/api\/lock-status$/, handler: () => getDemoLockStatus() },
  { pattern: /\/api\/lock\//, handler: () => getDemoLockStatus() },
  { pattern: /\/api\/system\/info$/, handler: () => getDemoSystemInfo() },
  { pattern: /\/api\/provisioning\/system-info$/, handler: () => getDemoSystemInfo() },
  { pattern: /\/api\/provisioning\/debug$/, handler: () => ({ success: true, debug: { mode: "demo" } }) },
  { pattern: /\/api\/environment/, handler: () => ({ success: true, content: "# Demo\nVITE_API_URL=", variables: { VITE_API_URL: "" }, path: ".env" }) },
  { pattern: /\/api\/environment\/[^/]+$/, handler: () => ({ success: true, message: "Environment variable updated (demo)", path: ".env", variables: {} }) },
  { pattern: /\/api\/docker-compose/, handler: () => ({ success: true, content: "version: '3'\n", path: "docker-compose.yml" }) },
  { pattern: /\/api\/ark-servers/, handler: () => ({ success: true, servers: [], count: 0 }) },
  { pattern: /\/api\/mods$/, handler: () => ({ success: true, mods: [] }) },
  { pattern: /\/api\/containers$/, handler: () => ({ success: true, containers: getDemoServers().containers }) },
  { pattern: /\/api\/containers\/([^/]+)\/(start|stop|restart)$/, handler: () => ({ success: true, message: "Container operation (demo)" }) },
  { pattern: /\/api\/containers\/([^/]+)\/rcon$/, handler: (_p, _m, d) => ({ success: true, response: getDemoRconResponse((d as any)?.command || ""), message: "RCON (demo)" }) },
  { pattern: /\/api\/containers\/([^/]+)\/status$/, handler: (p) => { const m = p.match(/\/containers\/([^/]+)\/status/); return getDemoServerStatus(m?.[1] ?? ""); } },
  { pattern: /\/api\/containers\/([^/]+)\/running$/, handler: (p) => { const m = p.match(/\/containers\/([^/]+)\/running/); const s = getDemoServerStatus(m?.[1] ?? ""); return { success: true, running: s.status.status === "running" }; } },
  { pattern: /\/api\/containers\/([^/]+)\/logs$/, handler: (p) => { const m = p.match(/\/containers\/([^/]+)\/logs/); return getDemoServerLogs(m?.[1] ?? ""); } },
  { pattern: /\/api\/native-servers$/, handler: () => ({ success: true, servers: getDemoServers().nativeServers }) },
  { pattern: /\/api\/native-servers\/([^/]+)\/status$/, handler: (p) => { const m = p.match(/\/native-servers\/([^/]+)\/status/); return getDemoServerStatus(m?.[1] ?? ""); } },
  { pattern: /\/api\/native-servers\/([^/]+)\/running$/, handler: (p) => { const m = p.match(/\/native-servers\/([^/]+)\/running/); const s = getDemoServerStatus(m?.[1] ?? ""); return { success: true, running: s.status.status === "running" }; } },
  { pattern: /\/api\/native-servers\/([^/]+)\/(start|stop|restart)$/, handler: () => ({ success: true, message: "Operation (demo)" }) },
  { pattern: /\/api\/native-servers\/([^/]+)\/rcon$/, handler: (_p, _m, d) => ({ success: true, response: getDemoRconResponse((d as any)?.command || ""), message: "RCON (demo)" }) },
  { pattern: /\/api\/native-servers\/([^/]+)\/logs$/, handler: (p) => { const m = p.match(/\/native-servers\/([^/]+)\/logs/); return getDemoServerLogs(m?.[1] ?? ""); } },
  { pattern: /\/api\/native-servers\/([^/]+)\/log-files$/, handler: () => ({ success: true, logFiles: [] }) },
  { pattern: /\/api\/native-servers\/([^/]+)\/mods$/, handler: () => ({ success: true, serverConfig: { additionalMods: [], excludeSharedMods: false } }) },
  { pattern: /\/api\/native-servers\/([^/]+)\/save-files/i, handler: () => getDemoSaveFiles() },
  { pattern: /\/api\/native-servers\/([^/]+)\/start-bat$/, handler: () => ({ success: true, content: "@echo off\ncls\necho Demo", path: "D:\\ARK\\start.bat" }) },
  { pattern: /\/api\/configs\/ark\/([^/]+)\/info$/, handler: () => ({ success: true, server: { name: "demo", map: "TheIsland" } }) },
  { pattern: /\/api\/configs\/ark\//, handler: () => ({ success: true, content: "[ServerSettings]\nMaxPlayers=70\n", path: "D:\\ARK\\Configs" }) },
  { pattern: /\/api\/configs\/([^/]+)$/, handler: () => ({ success: true, content: "[ServerSettings]\nMaxPlayers=70\n", filename: "GameUserSettings.ini", map: "TheIsland", configPath: "D:\\ARK\\Configs", filePath: "D:\\ARK\\Configs\\GameUserSettings.ini", fileName: "GameUserSettings.ini", serverName: "demo" }) },
  { pattern: /\/api\/configs$/, handler: () => ({ success: true, servers: [], count: 0, rootPath: "D:\\ARK" }) },
  { pattern: /\/api\/servers\/([^/]+)\/config\/files$/, handler: () => ({ success: true, files: ["GameUserSettings.ini", "Game.ini"], serverName: "demo", path: "D:\\ARK\\Configs", defaultFiles: ["GameUserSettings.ini", "Game.ini"] }) },
  { pattern: /\/api\/servers\/([^/]+)\/config$/, handler: (p) => ({ success: true, content: "[ServerSettings]\nMaxPlayers=70\n", filePath: "D:\\ARK\\Configs\\GameUserSettings.ini", fileName: "GameUserSettings.ini", serverName: p.match(/\/api\/servers\/([^/]+)\/config/)?.[1] ?? "demo", configPath: "D:\\ARK\\Configs" }) },
  { pattern: /\/api\/servers\/([^/]+)$/, handler: (p) => ({ success: true, name: p.match(/\/api\/servers\/([^/]+)/)?.[1] ?? "demo", map: "TheIsland", status: "running", configPath: "D:\\ARK\\Configs" }) },
  { pattern: /\/api\/servers$/, handler: () => ({ success: true, servers: [], count: 0, rootPath: "D:\\ARK" }) },
  { pattern: /\/api\/provisioning\/global-configs$/, handler: () => getDemoGlobalConfigs() },
  { pattern: /\/api\/provisioning\/shared-mods$/, handler: () => ({ success: true, sharedMods: [] }) },
  { pattern: /\/api\/provisioning\/mods-overview$/, handler: () => getDemoModsOverview() },
  { pattern: /\/api\/provisioning\/config-exclusions$/, handler: () => ({ success: true, excludedServers: [] }) },
  { pattern: /\/api\/provisioning\/initialize$/, handler: () => ({ success: true, message: "Initialized (demo)" }) },
  { pattern: /\/api\/provisioning\/find-steamcmd$/, handler: () => ({ success: true, found: true, steamCmdPath: "C:\\SteamCMD" }) },
  { pattern: /\/api\/provisioning\/configure-steamcmd$/, handler: () => ({ success: true, message: "Configured (demo)" }) },
  { pattern: /\/api\/provisioning\/install-asa-binaries$/, handler: () => ({ success: true, message: "Installed (demo)" }) },
  { pattern: /\/api\/provisioning\/regenerate-start-scripts$/, handler: () => ({ success: true, message: "Regenerated (demo)" }) },
  { pattern: /\/api\/provisioning\/system-logs$/, handler: () => getDemoSystemLogs() },
  { pattern: /\/api\/provisioning\/server-mods\//, handler: () => ({ success: true, serverConfig: { additionalMods: [], excludeSharedMods: false } }) },
  { pattern: /\/api\/provisioning\/servers\//, handler: () => ({ success: true, message: "Server operation (demo)" }) },
  { pattern: /\/api\/provisioning\/clusters\/([^/]+)\/(start|stop|restart)$/, handler: () => ({ success: true, message: "Cluster action (demo)" }) },
  { pattern: /\/api\/provisioning\/clusters\/([^/]+)$/, handler: (p) => { const m = p.match(/\/clusters\/([^/]+)/); const name = m?.[1] ?? ""; const clusters = getDemoClusters(); return { success: true, cluster: clusters.find((c) => c.name === name) || clusters[0] }; } },
  { pattern: /\/api\/provisioning\/clusters$/, handler: () => ({ success: true, clusters: getDemoClusters() }) },
  { pattern: /\/api\/provisioning\/cluster-backups\//, handler: () => ({ success: true, data: [] }) },
  { pattern: /\/api\/provisioning\/update-all-servers/, handler: () => ({ success: true, message: "Updated (demo)" }) },
  { pattern: /\/api\/provisioning\/update-status-all$/, handler: () => ({ success: true, data: [] }) },
  { pattern: /\/api\/provisioning\/server-backups$/, handler: () => ({ success: true, data: [] }) },
  { pattern: /\/api\/provisioning\/create-server$/, handler: () => ({ success: true, message: "Created (demo)" }) },
  { pattern: /\/api\/logs\//, handler: () => ({ success: true, content: "[INFO] Demo log\n", logFiles: [] }) },
  { pattern: /\/api\/auto-update\/config$/, handler: () => getDemoAutoUpdateConfig() },
  { pattern: /\/api\/auto-shutdown\/config$/, handler: () => getDemoAutoUpdateConfig() },
  { pattern: /\/api\/auto-update\/status$/, handler: () => ({ success: true, schedulerRunning: true, servers: [] }) },
  { pattern: /\/api\/auto-update\//, handler: () => ({ success: true, message: "Auto-update (demo)" }) },
  { pattern: /\/api\/discord\/webhooks$/, handler: () => ({ success: true, webhooks: getDemoDiscordConfig().webhooks }) },
  { pattern: /\/api\/discord\/webhooks\//, handler: () => ({ success: true, message: "Webhook (demo)" }) },
  { pattern: /\/api\/discord\/bot\/config$/, handler: () => ({ success: true, config: getDemoDiscordConfig().bot }) },
  { pattern: /\/api\/discord\/(config|settings)$/, handler: () => getDemoDiscordConfig() },
];

export function getMockData(path: string, method: string, body?: unknown): unknown {
  for (const { pattern, handler } of ROUTES) {
    if (pattern.test(path)) {
      return handler(path, method, body);
    }
  }
  return undefined;
}
