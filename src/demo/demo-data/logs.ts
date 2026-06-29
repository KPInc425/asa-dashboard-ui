const LOG_SOURCES = ["ServerManager", "RCON", "AutoUpdate", "DiscordBot", "SteamCMD", "BackupService", "Watchdog"];

const LOG_MESSAGES: Record<string, string[]> = {
  ServerManager: ["Server ark-theisland health check passed (uptime: 3d 14h)", "Server ark-scorched health check passed (uptime: 3d 12h)", "Server ark-aberration health check passed (uptime: 3d 10h)", "Polling server status for all 10 managed servers", "Server ark-genesis1 detected as STOPPED — no action required", "Server ark-valguero transitioned to RESTARTING — waiting for recovery", "Cluster main-cluster: all 6 servers healthy", "Cluster pvp-cluster: 3/4 servers healthy (ark-crystalisles stopped)", "Scheduled world save broadcast sent to all running servers", "Server performance report: avg CPU 37%, avg MEM 65%"],
  RCON: ["Connection established to ark-theisland:32330", "RCON command executed: listplayers (response: 12 players)", "Connection established to ark-fjordur:32336", "RCON command executed: saveworld on all servers", 'Broadcast message sent: "Server restart in 15 minutes"', "RCON connection to ark-genesis1 failed — server is offline", 'Admin command detected: cheat giveitem "Blueprint\\/Game\\/PrimalEarth\\/CoreBlueprints\\/Weapons\\/PrimalItem_WeaponGun.PrimalItem_WeaponGun" 1 0 0'],
  AutoUpdate: ["Update check initiated for all 10 servers", "ark-theisland: checking for ARK server updates via SteamCMD", "ark-theisland: server is up to date (build ID: 12345678)", "ark-scorched: server is up to date (build ID: 12345678)", "ark-fjordur: update available (current: 12345600, latest: 12345678)", "ark-fjordur: initiating update...", "ark-fjordur: update completed successfully (took 4m 32s)", "Auto-update schedule: daily at 04:00 UTC", "Next scheduled update: in 6h 23m"],
  DiscordBot: ["Webhook notification sent: Server Status Update", "Player count notification: 42 players on main cluster", 'Webhook "server-alerts" delivered successfully', "Discord bot connected (latency: 42ms)", "Webhook notification sent: Server ark-theisland started", "Webhook notification sent: Server ark-valguero restarting"],
  SteamCMD: ["SteamCMD initialized (app ID: 2430930)", "Checking for ARK: Survival Ascended updates", "Downloading update for build ID 12345678...", "Update downloaded: 1.2 GB in 45s (28.3 MB/s)", "Verifying installation... 100% complete", "No update available — server is current"],
  BackupService: ["Incremental backup started for main-cluster", "Backing up ark-theisland save data (128 MB)", "Backing up ark-scorched save data (94 MB)", "Backing up ark-aberration save data (156 MB)", "Backing up ark-extinction save data (112 MB)", "Backup complete for main-cluster (total: 634 MB)", "Pruning backups older than 30 days...", "Removed 3 old backups, freed 2.1 GB"],
  Watchdog: ["Watchdog monitor active — checking all 10 servers every 60s", "All servers nominal", "Process monitor: ArkAscendedServer.exe (PID 4821) — CPU 28%, MEM 4.2GB", "Process monitor: ArkAscendedServer.exe (PID 4932) — CPU 35%, MEM 3.8GB", "Alert: Server ark-genesis1 has been stopped for 48h — sending notification", "Memory pressure warning: system memory at 78%"],
};

export function getDemoSystemLogs() {
  const logEntries: { timestamp: string; level: string; source: string; message: string }[] = [];
  for (let i = 0; i < 200; i++) {
    const source = LOG_SOURCES[Math.floor(Math.random() * LOG_SOURCES.length)];
    const messages = LOG_MESSAGES[source];
    const message = messages[Math.floor(Math.random() * messages.length)];
    const level = source === "Watchdog" && message.includes("Alert") ? "WARN" : source === "AutoUpdate" && message.includes("failed") ? "ERROR" : "INFO";
    const timestamp = new Date(Date.now() - Math.floor(Math.random() * 86400000)).toISOString();
    logEntries.push({ timestamp, level, source, message });
  }
  logEntries.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  return {
    success: true,
    serviceInfo: { mode: "native", isWindowsService: false, serviceInstallPath: "D:\\ARK\\Manager", logBasePath: "D:\\ARK\\Logs", currentWorkingDirectory: "D:\\ARK\\Manager", processId: 4821, parentProcessId: 1234 },
    logFiles: {
      combined: { content: logEntries.slice(0, 100).map((e) => `[${e.timestamp}] [${e.level}] [${e.source}] ${e.message}`).join("\n"), path: "D:\\ARK\\Logs\\combined.log", exists: true },
      error: { content: logEntries.filter((e) => e.level === "ERROR" || e.level === "WARN").slice(0, 30).map((e) => `[${e.timestamp}] [${e.level}] [${e.source}] ${e.message}`).join("\n"), path: "D:\\ARK\\Logs\\error.log", exists: true },
    },
    totalLogFiles: 4,
  };
}

export function getDemoServerLogs(_serverName?: string): { success: boolean; content: string } {
  const logLines: string[] = [];
  for (let i = 0; i < 50; i++) {
    const time = new Date(Date.now() - (50 - i) * 60000).toLocaleTimeString();
    const messages = [
      `[${time}] [INFO] Server tick: 59.82 FPS, 0.9997 tick rate`,
      `[${time}] [INFO] Player connected: Survivor_${Math.random().toString(36).substring(2, 7)}`,
      `[${time}] [INFO] World save started`,
      `[${time}] [INFO] World save completed (128 MB in 0.8s)`,
      `[${time}] [WARN] Connection timeout from 192.168.1.100:54321`,
      `[${time}] [INFO] RCON command received: listplayers`,
      `[${time}] [INFO] RCON command processed (12 players online)`,
      `[${time}] [INFO] Dino spawn batch completed (34 wild dinos spawned)`,
      `[${time}] [INFO] Structure count: 8741 — 98.2% of limit`,
      `[${time}] [INFO] Network stats: 12.4 MB/s in, 3.2 MB/s out`,
    ];
    logLines.push(messages[Math.floor(Math.random() * messages.length)]);
  }
  return { success: true, content: logLines.join("\n") };
}
