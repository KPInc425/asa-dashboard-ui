import { getDemoServers } from "./servers-clusters";

export function getDemoSystemInfo() {
  return {
    success: true,
    systemInfo: {
      diskSpace: { total: 4000000000000, free: 1200000000000, used: 2800000000000, usagePercent: 70, drive: "D" },
      memory: { total: 34359738368, free: 12884901888, used: 21474836480, usagePercent: 62.5 },
      steamCmdInstalled: true, steamCmdPath: "C:\\SteamCMD\\steamcmd.exe",
      asaBinariesInstalled: true, basePath: "D:\\ARK\\Servers",
      platform: "win32", arch: "x64", nodeVersion: "v20.11.0", cpuCores: 16, uptime: 1209600,
    },
    status: {
      diskSpace: { total: 4000000000000, free: 1200000000000, used: 2800000000000, usagePercent: 70, drive: "D" },
      memory: { total: 34359738368, free: 12884901888, used: 21474836480, usagePercent: 62.5 },
      steamCmdInstalled: true, steamCmdPath: "C:\\SteamCMD\\steamcmd.exe",
      asaBinariesInstalled: true, basePath: "D:\\ARK\\Servers",
      platform: "win32", arch: "x64", nodeVersion: "v20.11.0", cpuCores: 16,
    },
  };
}

export function getDemoServerStatus(serverName: string) {
  const allServers = [...getDemoServers().containers, ...getDemoServers().nativeServers];
  const server = allServers.find((s) => s.name === serverName);
  return {
    success: true,
    status: {
      status: server?.status || "unknown",
      running: server?.status === "running",
      source: "rcon" as const,
      updatedAt: new Date().toISOString(),
      players: { online: server?.players || 0, max: server?.maxPlayers || 70 },
      performance: { cpu: 35 + Math.floor(Math.random() * 40), memory: 60 + Math.floor(Math.random() * 30), uptime: server?.status === "running" ? 86400 + Math.floor(Math.random() * 432000) : 0 },
    },
    running: server?.status === "running",
  };
}
