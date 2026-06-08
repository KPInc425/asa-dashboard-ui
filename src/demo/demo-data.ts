/**
 * Demo Mode — Rich Mock Data
 *
 * Realistic ARK: Survival Ascended server data for the public demo instance.
 * Covers all pages: Dashboard, Servers, ServerDetails, Configs, RCON,
 * System Logs, Discord, Auto-Update, and Provisioning.
 */

import type { Container, User } from "../services/api-core";

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export const DEMO_USER: User = {
  username: "Demo Viewer",
  role: "admin",
  permissions: ["read", "write", "admin", "user_management"],
  profile: {
    firstName: "Demo",
    lastName: "Viewer",
    displayName: "Demo Viewer",
    email: "demo@ark-server-dashboard.io",
    timezone: "UTC",
    language: "en",
  },
};

// ---------------------------------------------------------------------------
// Maps
// ---------------------------------------------------------------------------

export const ARK_MAPS = [
  "TheIsland",
  "ScorchedEarth",
  "Aberration",
  "Extinction",
  "Genesis1",
  "Genesis2",
  "CrystalIsles",
  "LostIsland",
  "Fjordur",
  "Ragnarok",
  "Valguero",
  "TheCenter",
];

// ---------------------------------------------------------------------------
// Servers — rich list with varied statuses, maps, clusters, player counts
// ---------------------------------------------------------------------------

export interface DemoServers {
  containers: Container[];
  nativeServers: Container[];
}

export function getDemoServers(): DemoServers {
  const containers: Container[] = [
    {
      name: "ark-theisland",
      status: "running",
      image: "ark:latest",
      ports: ["7777:7777/udp", "27015:27015/udp", "32330:32330/tcp"],
      created: daysAgo(45),
      type: "container",
      map: "TheIsland",
      clusterName: "main-cluster",
      gamePort: 7777,
      queryPort: 27015,
      rconPort: 32330,
      maxPlayers: 70,
      players: 42,
      serverCount: 1,
      serverPath: "/ark/server/TheIsland",
    },
    {
      name: "ark-scorched",
      status: "running",
      image: "ark:latest",
      ports: ["7781:7777/udp", "27016:27015/udp", "32331:32330/tcp"],
      created: daysAgo(42),
      type: "container",
      map: "ScorchedEarth",
      clusterName: "main-cluster",
      gamePort: 7781,
      queryPort: 27016,
      rconPort: 32331,
      maxPlayers: 70,
      players: 28,
      serverPath: "/ark/server/ScorchedEarth",
    },
    {
      name: "ark-aberration",
      status: "running",
      image: "ark:latest",
      ports: ["7782:7777/udp", "27017:27015/udp", "32332:32330/tcp"],
      created: daysAgo(40),
      type: "container",
      map: "Aberration",
      clusterName: "main-cluster",
      gamePort: 7782,
      queryPort: 27017,
      rconPort: 32332,
      maxPlayers: 70,
      players: 35,
      serverPath: "/ark/server/Aberration",
    },
    {
      name: "ark-extinction",
      status: "running",
      image: "ark:latest",
      ports: ["7783:7777/udp", "27018:27015/udp", "32333:32330/tcp"],
      created: daysAgo(38),
      type: "container",
      map: "Extinction",
      clusterName: "main-cluster",
      gamePort: 7783,
      queryPort: 27018,
      rconPort: 32333,
      maxPlayers: 70,
      players: 51,
      serverPath: "/ark/server/Extinction",
    },
    {
      name: "ark-genesis1",
      status: "stopped",
      image: "ark:latest",
      ports: ["7784:7777/udp", "27019:27015/udp", "32334:32330/tcp"],
      created: daysAgo(35),
      type: "container",
      map: "Genesis1",
      clusterName: "main-cluster",
      gamePort: 7784,
      queryPort: 27019,
      rconPort: 32334,
      maxPlayers: 70,
      players: 0,
      serverPath: "/ark/server/Genesis1",
    },
    {
      name: "ark-genesis2",
      status: "running",
      image: "ark:latest",
      ports: ["7785:7777/udp", "27020:27015/udp", "32335:32330/tcp"],
      created: daysAgo(30),
      type: "container",
      map: "Genesis2",
      clusterName: "main-cluster",
      gamePort: 7785,
      queryPort: 27020,
      rconPort: 32335,
      maxPlayers: 70,
      players: 19,
      serverPath: "/ark/server/Genesis2",
    },
    {
      name: "ark-fjordur",
      status: "running",
      image: "ark:latest",
      ports: ["7786:7777/udp", "27021:27015/udp", "32336:32330/tcp"],
      created: daysAgo(25),
      type: "container",
      map: "Fjordur",
      clusterName: "pvp-cluster",
      gamePort: 7786,
      queryPort: 27021,
      rconPort: 32336,
      maxPlayers: 100,
      players: 78,
      serverPath: "/ark/server/Fjordur",
    },
    {
      name: "ark-ragnarok",
      status: "running",
      image: "ark:latest",
      ports: ["7787:7777/udp", "27022:27015/udp", "32337:32330/tcp"],
      created: daysAgo(20),
      type: "container",
      map: "Ragnarok",
      clusterName: "pvp-cluster",
      gamePort: 7787,
      queryPort: 27022,
      rconPort: 32337,
      maxPlayers: 100,
      players: 63,
      serverPath: "/ark/server/Ragnarok",
    },
    {
      name: "ark-crystalisles",
      status: "stopped",
      image: "ark:latest",
      ports: ["7788:7777/udp", "27023:27015/udp", "32338:32330/tcp"],
      created: daysAgo(15),
      type: "container",
      map: "CrystalIsles",
      clusterName: "pvp-cluster",
      gamePort: 7788,
      queryPort: 27023,
      rconPort: 32338,
      maxPlayers: 100,
      players: 0,
      serverPath: "/ark/server/CrystalIsles",
    },
    {
      name: "ark-valguero",
      status: "restarting",
      image: "ark:latest",
      ports: ["7789:7777/udp", "27024:27015/udp", "32339:32330/tcp"],
      created: daysAgo(10),
      type: "container",
      map: "Valguero",
      clusterName: "pvp-cluster",
      gamePort: 7789,
      queryPort: 27024,
      rconPort: 32339,
      maxPlayers: 100,
      players: 0,
      serverPath: "/ark/server/Valguero",
    },
  ];

  const nativeServers: Container[] = [
    {
      name: "TheIsland-Primary",
      status: "running",
      image: "",
      ports: ["7777:7777/udp", "27015:27015/udp"],
      created: daysAgo(120),
      type: "native",
      map: "TheIsland",
      clusterName: "legacy-cluster",
      gamePort: 7777,
      queryPort: 27015,
      rconPort: 32330,
      maxPlayers: 70,
      players: 33,
      serverPath:
        "C:\\ARK\\ShooterGame\\Binaries\\Win64\\ArkAscendedServer.exe",
    },
    {
      name: "Center-PvP",
      status: "running",
      image: "",
      ports: ["7780:7777/udp", "27025:27015/udp"],
      created: daysAgo(90),
      type: "native",
      map: "TheCenter",
      clusterName: "legacy-cluster",
      gamePort: 7780,
      queryPort: 27025,
      rconPort: 32340,
      maxPlayers: 80,
      players: 55,
      serverPath:
        "C:\\ARK\\ShooterGame\\Binaries\\Win64\\ArkAscendedServer.exe",
    },
    {
      name: "LostIsland-Experimental",
      status: "stopped",
      image: "",
      ports: ["7790:7777/udp", "27026:27015/udp"],
      created: daysAgo(60),
      type: "native",
      map: "LostIsland",
      clusterName: "legacy-cluster",
      gamePort: 7790,
      queryPort: 27026,
      rconPort: 32341,
      maxPlayers: 70,
      players: 0,
      serverPath:
        "C:\\ARK\\ShooterGame\\Binaries\\Win64\\ArkAscendedServer.exe",
    },
  ];

  return { containers, nativeServers };
}

// ---------------------------------------------------------------------------
// Clusters
// ---------------------------------------------------------------------------

export function getDemoClusters() {
  const { containers, nativeServers } = getDemoServers();

  return [
    {
      name: "main-cluster",
      description:
        "Primary PvE cluster with all story maps. Cross-Ark transfer enabled, 3x harvest, 5x taming.",
      basePort: 7777,
      serverCount: containers.filter((c) => c.clusterName === "main-cluster")
        .length,
      created: daysAgo(45),
      servers: containers
        .filter((c) => c.clusterName === "main-cluster")
        .map((c) => ({ name: c.name, gamePort: c.gamePort, status: c.status })),
    },
    {
      name: "pvp-cluster",
      description:
        "Competitive PvP cluster with larger maps. 10x harvest, 10x taming, weekly events.",
      basePort: 7786,
      serverCount: containers.filter((c) => c.clusterName === "pvp-cluster")
        .length,
      created: daysAgo(25),
      servers: containers
        .filter((c) => c.clusterName === "pvp-cluster")
        .map((c) => ({ name: c.name, gamePort: c.gamePort, status: c.status })),
    },
    {
      name: "legacy-cluster",
      description:
        "Legacy native Windows servers. Direct .exe management, no containerization.",
      basePort: 7777,
      serverCount: nativeServers.length,
      created: daysAgo(120),
      servers: nativeServers.map((s) => ({
        name: s.name,
        gamePort: s.gamePort,
        status: s.status,
      })),
    },
  ];
}

// ---------------------------------------------------------------------------
// System Info
// ---------------------------------------------------------------------------

export function getDemoSystemInfo() {
  return {
    success: true,
    systemInfo: {
      diskSpace: {
        total: 4000000000000,
        free: 1200000000000,
        used: 2800000000000,
        usagePercent: 70,
        drive: "D",
      },
      memory: {
        total: 34359738368,
        free: 12884901888,
        used: 21474836480,
        usagePercent: 62.5,
      },
      steamCmdInstalled: true,
      steamCmdPath: "C:\\SteamCMD\\steamcmd.exe",
      asaBinariesInstalled: true,
      basePath: "D:\\ARK\\Servers",
      platform: "win32",
      arch: "x64",
      nodeVersion: "v20.11.0",
      cpuCores: 16,
      uptime: 1209600, // 14 days
    },
    status: {
      diskSpace: {
        total: 4000000000000,
        free: 1200000000000,
        used: 2800000000000,
        usagePercent: 70,
        drive: "D",
      },
      memory: {
        total: 34359738368,
        free: 12884901888,
        used: 21474836480,
        usagePercent: 62.5,
      },
      steamCmdInstalled: true,
      steamCmdPath: "C:\\SteamCMD\\steamcmd.exe",
      asaBinariesInstalled: true,
      basePath: "D:\\ARK\\Servers",
      platform: "win32",
      arch: "x64",
      nodeVersion: "v20.11.0",
      cpuCores: 16,
    },
  };
}

// ---------------------------------------------------------------------------
// Server Status / Live Data
// ---------------------------------------------------------------------------

export function getDemoServerStatus(serverName: string) {
  const allServers = [
    ...getDemoServers().containers,
    ...getDemoServers().nativeServers,
  ];
  const server = allServers.find((s) => s.name === serverName);

  return {
    success: true,
    status: {
      status: server?.status || "unknown",
      running: server?.status === "running",
      source: "rcon" as const,
      updatedAt: new Date().toISOString(),
      players: {
        online: server?.players || 0,
        max: server?.maxPlayers || 70,
      },
      performance: {
        cpu: 35 + Math.floor(Math.random() * 40),
        memory: 60 + Math.floor(Math.random() * 30),
        uptime:
          server?.status === "running"
            ? 86400 + Math.floor(Math.random() * 432000)
            : 0,
      },
    },
    running: server?.status === "running",
  };
}

// ---------------------------------------------------------------------------
// Config Files
// ---------------------------------------------------------------------------

const GAME_USER_SETTINGS_TEMPLATE = `[/Script/ShooterGame.ShooterGameUserSettings]
ResolutionSizeX=1920
ResolutionSizeY=1080
Language=en

[ServerSettings]
ServerName={serverName}
ServerPassword=
ServerAdminPassword=********
MaxPlayers={maxPlayers}
Port={gamePort}
QueryPort={queryPort}
RCONEnabled=True
RCONPort={rconPort}
TheMaxStructureDistance=0
SpectatorPassword=
DifficultyOffset=1.000000
DamageMultiplier=1.0
ResistanceMultiplier=1.0
HarvestAmountMultiplier=3.0
HarvestHealthMultiplier=1.0
XPMultiplier=3.0
TamingSpeedMultiplier=5.0
MatingIntervalMultiplier=0.5
BabyMatureSpeedMultiplier=10.0
BabyCuddleIntervalMultiplier=0.5
BabyCuddleGracePeriodMultiplier=2.0
BabyImprintAmountMultiplier=2.0
PvEStructureDecayPeriodMultiplier=1.0
StructurePreventResourceRadiusMultiplier=1.0
AllowFlyerCarryPvE=True
AlwaysNotifyPlayerLeft=True
DontAlwaysNotifyPlayerJoined=False
ShowMapPlayerLocation=True
ServerPVE=True
PreventOfflinePvP=False
CrossARKAllowForeignDinoDownloads=True
CrossARKAllowForeignItemDownloads=True
AllowAnyoneBabyImprintCuddle=True
AllowCaveBuildingPvE=False
AutoSavePeriodMinutes=15.0
ClusteringEnabled=True
PreventDownloadSurvivors=False
PreventDownloadItems=False
PreventDownloadDinos=False
RandomSupplyCratePoints=True
DayCycleSpeedScale=1.0
NightTimeSpeedScale=1.0
DayTimeSpeedScale=1.0
bAutoPvEUseTaming=True
RaidDinoCharacterFoodDrainMultiplier=1.0
PoopTimerInterval=0.5
`;

const GAME_INI_TEMPLATE = `[/Script/ShooterGame.ShooterGameMode]
ServerCrosshair=True
ShowAllStructureHealth=True
AllowThirdPersonPlayer=True
AlwaysSupplyDropBeacon=True
DisableDinoDecayPvE=True
AllowFlyerSpeedLeveling=True
bUseCorpseLocator=True
bPreventSpawnAnimation=False
bPassiveDefensesDamageRiderlessDinos=False
bDisableLootCrates=False
bUseSingleplayerSettings=False
bPvEDinoDecay=True
OverrideStructurePlatformPrevention=True
PreventOfflinePvPInterval=300.0
AutoDestroyStructures=
AutoDestroyOldStructuresPeriod=604800
PlatformSaddleBuildAreaMultiplier=3.0
bAutoImprintEnable=True
bMapPlayerLocation=True
bShowMapMarker=True
bUseMap=True
bDisableStructurePlacementInPvE=True
MapPlayerLocationPacketInterval=1.0
bUseAdminUI=True
bDisableWeatherFog=True
OverrideMaxExperiencePointsDino=120
OverrideMaxExperiencePointsPlayer=135
OverrideMaxExperiencePointsPlayerEngramLevels=120

[/Script/Engine.GameSession]
MaxPlayers={maxPlayers}

[/Game/PrimalEarth/CoreBlueprints/SupplyCrateSpawning/SupplyCrateDrops.ConfigSupplyCrateDrops]
MinItemSets=3
MaxItemSets=6
NumItemsPerSet=4
MinQualityMultiplier=0.5
MaxQualityMultiplier=2.5
`;

export function getDemoConfigFile(serverName: string, file: string) {
  const allServers = [
    ...getDemoServers().containers,
    ...getDemoServers().nativeServers,
  ];
  const server = allServers.find((s) => s.name === serverName) || allServers[0];

  if (file === "GameUserSettings.ini" || file.includes("GameUserSettings")) {
    return {
      content: GAME_USER_SETTINGS_TEMPLATE.replace(
        /\{serverName\}/g,
        server.name,
      )
        .replace(/\{maxPlayers\}/g, String(server.maxPlayers || 70))
        .replace(/\{gamePort\}/g, String(server.gamePort || 7777))
        .replace(/\{queryPort\}/g, String(server.queryPort || 27015))
        .replace(/\{rconPort\}/g, String(server.rconPort || 32330)),
      filename: "GameUserSettings.ini",
      map: server.map || "TheIsland",
      configPath: `/ark/config/${server.name}/GameUserSettings.ini`,
      filePath: `/ark/config/${server.name}/GameUserSettings.ini`,
      fileName: "GameUserSettings.ini",
      serverName: server.name,
    };
  }

  return {
    content: GAME_INI_TEMPLATE.replace(
      /\{maxPlayers\}/g,
      String(server.maxPlayers || 70),
    ),
    filename: "Game.ini",
    map: server.map || "TheIsland",
    configPath: `/ark/config/${server.name}/Game.ini`,
    filePath: `/ark/config/${server.name}/Game.ini`,
    fileName: "Game.ini",
    serverName: server.name,
  };
}

export function getDemoArkConfigFile(
  serverName: string,
  fileName: "Game.ini" | "GameUserSettings.ini",
) {
  const result = getDemoConfigFile(serverName, fileName);
  return { success: true, content: result.content, path: result.filePath };
}

export function getDemoGlobalConfigs() {
  return {
    success: true,
    gameIni: GAME_INI_TEMPLATE.replace(/\{maxPlayers\}/g, "70"),
    gameUserSettingsIni: GAME_USER_SETTINGS_TEMPLATE.replace(
      /\{serverName\}/g,
      "Global Default",
    )
      .replace(/\{maxPlayers\}/g, "70")
      .replace(/\{gamePort\}/g, "7777")
      .replace(/\{queryPort\}/g, "27015")
      .replace(/\{rconPort\}/g, "32330"),
  };
}

// ---------------------------------------------------------------------------
// Start scripts (batch files)
// ---------------------------------------------------------------------------

export function getDemoStartBat(serverName: string) {
  const server = getDemoServers()
    .containers.concat(getDemoServers().nativeServers)
    .find((s) => s.name === serverName);

  return {
    success: true,
    content: `@echo off
title ARK: Survival Ascended - ${server?.map || "TheIsland"}
set "SessionName=${server?.name || "ARK Server"}"
set "ServerMap=${server?.map || "TheIsland"}"
set "Port=${server?.gamePort || 7777}"
set "QueryPort=${server?.queryPort || 27015}"
set "MaxPlayers=${server?.maxPlayers || 70}"
set "RCONPort=${server?.rconPort || 32330}"
set "ClusterDirOverride=D:\\ARK\\Clusters"

start /high /affinity FFF ArkAscendedServer.exe ^
  %ServerMap%?listen?SessionName=%SessionName%?Port=%Port%?QueryPort=%QueryPort%?MaxPlayers=%MaxPlayers% ^
  -server -log -USEALLAVAILABLECORES -CULTUREFORENGINEERING -NoBattlEye ^
  -ClusterDirOverride=%ClusterDirOverride% ^
  -RCONPort=%RCONPort% -WinLiveMaxPlayers=%MaxPlayers%
`,
    path: `D:\\ARK\\Servers\\${serverName}\\start.bat`,
  };
}

// ---------------------------------------------------------------------------
// RCON responses
// ---------------------------------------------------------------------------

export const DEMO_RCON_RESPONSES: Record<string, string> = {
  listplayers: `1. Player_Alpha (SteamID: 76561197960287930)
2. BraveBravo (SteamID: 76561197960287931)
3. CharlieChad (SteamID: 76561197960287932)
4. DeltaForce (SteamID: 76561197960287933)
5. EchoEcho (SteamID: 76561197960287934)
6. Foxtrot_Unity (SteamID: 76561197960287935)
7. GolfGamer (SteamID: 76561197960287936)
8. HotelHero (SteamID: 76561197960287937)
9. India_IX (SteamID: 76561197960287938)
10. JulietJuliet (SteamID: 76561197960287939)
11. Kilo_Kilo (SteamID: 76561197960287940)
12. Lima_Lima (SteamID: 76561197960287941)
Total 12 players online`,
  saveworld: "World is now saving... World has been saved.",
  destroywilddinos:
    "Destroying all wild dinosaurs... Everything is dead. Good work.",
  getgameinfo: `The server is running on map: TheIsland
Session name: ARK PvE Cluster
Player count: 42/70
Tame count: 1342
Structure count: 8741
Server uptime: 3d 14h 23m
Server FPS: 59.8
Ticking accuracy: 0.9997
Server Game Time: 482.3 days`,
  showmyadminmanager: `Admin logging is enabled.
Admin commands are logged to: /ark/logs/AdminCommands.log
Active administrators: Demo_Viewer, ServerAdmin, ModManager`,
  "cheat getplayercount": "12",
  "cheat scriptcommand getstats":
    "Server running at optimal performance. Memory: 8.2/32GB used. CPU: 34%. Network: 12.4MB/s in, 3.2MB/s out.",
};

export function getDemoRconResponse(command: string): string {
  const cmd = command.trim().toLowerCase();
  if (DEMO_RCON_RESPONSES[cmd]) return DEMO_RCON_RESPONSES[cmd];

  // Simulate a response for unknown commands
  return `Command '${command}' executed successfully on server. (Demo mode simulation)`;
}

// ---------------------------------------------------------------------------
// Mods
// ---------------------------------------------------------------------------

export const DEMO_MODS = [
  {
    id: "893531541",
    name: "Structures Plus (S+)",
    description:
      "Expanded building system with additional structures and automation",
    author: "Orionsun",
    version: "3.10.5",
  },
  {
    id: "895711211",
    name: "Classic Flyers",
    description: "Restores the classic flyer movement and speed leveling",
    author: "Cryo",
    version: "2.2.1",
  },
  {
    id: "891432179",
    name: "Awesome Teleporters!",
    description: "Teleportation system with configurable pads and networks",
    author: "St1ko",
    version: "2.9.0",
  },
  {
    id: "887020303",
    name: "Dino Storage v2",
    description: "Advanced creature storage, management, and soul terminal",
    author: "Cyrus",
    version: "3.8.2",
  },
  {
    id: "889745254",
    name: "ARK Additions: The Collection!",
    description:
      "Adds new creatures like the Deinonychus, Xiphactinus, and more",
    author: "Garuga123",
    version: "2.4.0",
  },
  {
    id: "892697614",
    name: "Super Structures",
    description: "Quality-of-life structures, tools, and QoL improvements",
    author: "Kishark",
    version: "1.8.1",
  },
  {
    id: "896748157",
    name: "HG Building Improvements",
    description: "Stackable foundations, improved snapping, and building QoL",
    author: "HomoGamer",
    version: "1.5.3",
  },
  {
    id: "890870996",
    name: "Better Spoiling",
    description: "Adjustable spoil times for all perishable items",
    author: "Kittens",
    version: "1.2.0",
  },
];

// ---------------------------------------------------------------------------
// Logs
// ---------------------------------------------------------------------------

const LOG_SOURCES = [
  "ServerManager",
  "RCON",
  "AutoUpdate",
  "DiscordBot",
  "SteamCMD",
  "BackupService",
  "Watchdog",
];

const LOG_MESSAGES: Record<string, string[]> = {
  ServerManager: [
    "Server ark-theisland health check passed (uptime: 3d 14h)",
    "Server ark-scorched health check passed (uptime: 3d 12h)",
    "Server ark-aberration health check passed (uptime: 3d 10h)",
    "Polling server status for all 10 managed servers",
    "Server ark-genesis1 detected as STOPPED — no action required",
    "Server ark-valguero transitioned to RESTARTING — waiting for recovery",
    "Cluster main-cluster: all 6 servers healthy",
    "Cluster pvp-cluster: 3/4 servers healthy (ark-crystalisles stopped)",
    "Scheduled world save broadcast sent to all running servers",
    "Server performance report: avg CPU 37%, avg MEM 65%",
  ],
  RCON: [
    "Connection established to ark-theisland:32330",
    "RCON command executed: listplayers (response: 12 players)",
    "Connection established to ark-fjordur:32336",
    "RCON command executed: saveworld on all servers",
    'Broadcast message sent: "Server restart in 15 minutes"',
    "RCON connection to ark-genesis1 failed — server is offline",
    'Admin command detected: cheat giveitem "Blueprint\\/Game\\/PrimalEarth\\/CoreBlueprints\\/Weapons\\/PrimalItem_WeaponGun.PrimalItem_WeaponGun" 1 0 0',
  ],
  AutoUpdate: [
    "Update check initiated for all 10 servers",
    "ark-theisland: checking for ARK server updates via SteamCMD",
    "ark-theisland: server is up to date (build ID: 12345678)",
    "ark-scorched: server is up to date (build ID: 12345678)",
    "ark-fjordur: update available (current: 12345600, latest: 12345678)",
    "ark-fjordur: initiating update...",
    "ark-fjordur: update completed successfully (took 4m 32s)",
    "Auto-update schedule: daily at 04:00 UTC",
    "Next scheduled update: in 6h 23m",
  ],
  DiscordBot: [
    "Webhook notification sent: Server Status Update",
    "Player count notification: 42 players on main cluster",
    'Webhook "server-alerts" delivered successfully',
    "Discord bot connected (latency: 42ms)",
    "Webhook notification sent: Server ark-theisland started",
    "Webhook notification sent: Server ark-valguero restarting",
  ],
  SteamCMD: [
    "SteamCMD initialized (app ID: 2430930)",
    "Checking for ARK: Survival Ascended updates",
    "Downloading update for build ID 12345678...",
    "Update downloaded: 1.2 GB in 45s (28.3 MB/s)",
    "Verifying installation... 100% complete",
    "No update available — server is current",
  ],
  BackupService: [
    "Incremental backup started for main-cluster",
    "Backing up ark-theisland save data (128 MB)",
    "Backing up ark-scorched save data (94 MB)",
    "Backing up ark-aberration save data (156 MB)",
    "Backing up ark-extinction save data (112 MB)",
    "Backup complete for main-cluster (total: 634 MB)",
    "Pruning backups older than 30 days...",
    "Removed 3 old backups, freed 2.1 GB",
  ],
  Watchdog: [
    "Watchdog monitor active — checking all 10 servers every 60s",
    "All servers nominal",
    "Process monitor: ArkAscendedServer.exe (PID 4821) — CPU 28%, MEM 4.2GB",
    "Process monitor: ArkAscendedServer.exe (PID 4932) — CPU 35%, MEM 3.8GB",
    "Alert: Server ark-genesis1 has been stopped for 48h — sending notification",
    "Memory pressure warning: system memory at 78%",
  ],
};

export function getDemoSystemLogs() {
  const logEntries: {
    timestamp: string;
    level: string;
    source: string;
    message: string;
  }[] = [];

  // Generate 200 log entries over the past 24 hours
  for (let i = 0; i < 200; i++) {
    const source = LOG_SOURCES[Math.floor(Math.random() * LOG_SOURCES.length)];
    const messages = LOG_MESSAGES[source];
    const message = messages[Math.floor(Math.random() * messages.length)];
    const level =
      source === "Watchdog" && message.includes("Alert")
        ? "WARN"
        : source === "AutoUpdate" && message.includes("failed")
          ? "ERROR"
          : "INFO";

    const timestamp = new Date(
      Date.now() - Math.floor(Math.random() * 86400000),
    ).toISOString();

    logEntries.push({ timestamp, level, source, message });
  }

  // Sort by timestamp descending (newest first)
  logEntries.sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  return {
    success: true,
    serviceInfo: {
      mode: "native",
      isWindowsService: false,
      serviceInstallPath: "D:\\ARK\\Manager",
      logBasePath: "D:\\ARK\\Logs",
      currentWorkingDirectory: "D:\\ARK\\Manager",
      processId: 4821,
      parentProcessId: 1234,
    },
    logFiles: {
      combined: {
        content: logEntries
          .slice(0, 100)
          .map(
            (e) => `[${e.timestamp}] [${e.level}] [${e.source}] ${e.message}`,
          )
          .join("\n"),
        path: "D:\\ARK\\Logs\\combined.log",
        exists: true,
      },
      error: {
        content: logEntries
          .filter((e) => e.level === "ERROR" || e.level === "WARN")
          .slice(0, 30)
          .map(
            (e) => `[${e.timestamp}] [${e.level}] [${e.source}] ${e.message}`,
          )
          .join("\n"),
        path: "D:\\ARK\\Logs\\error.log",
        exists: true,
      },
    },
    totalLogFiles: 4,
  };
}

export function getDemoServerLogs(/* serverName */ _serverName?: string): {
  success: boolean;
  content: string;
} {
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
  return {
    success: true,
    content: logLines.join("\n"),
  };
}

// ---------------------------------------------------------------------------
// Discord configuration
// ---------------------------------------------------------------------------

export function getDemoDiscordConfig() {
  return {
    success: true,
    enabled: true,
    webhooks: [
      {
        id: "wh-server-status",
        name: "Server Status Updates",
        url: "https://discord.com/api/webhooks/demo-server-status/xxxxxxxxxx",
        events: [
          "server_start",
          "server_stop",
          "server_crash",
          "server_update",
        ],
        active: true,
      },
      {
        id: "wh-player-alerts",
        name: "Player Alerts",
        url: "https://discord.com/api/webhooks/demo-player-alerts/xxxxxxxxxx",
        events: ["player_join", "player_leave", "player_ban"],
        active: true,
      },
      {
        id: "wh-backup-notify",
        name: "Backup Notifications",
        url: "https://discord.com/api/webhooks/demo-backup/xxxxxxxxxx",
        events: ["backup_start", "backup_complete", "backup_failed"],
        active: false,
      },
    ],
    bot: {
      enabled: true,
      token: "demo-bot-token-xxxxxxxxxx",
      prefix: "!",
      applicationId: "123456789012345678",
      status: "online",
      latency: 42,
      serverCount: 10,
      commandsEnabled: true,
      allowedChannels: ["general", "server-alerts", "admin-chat"],
      allowedRoles: ["Admin", "Moderator", "Server Manager"],
    },
  };
}

// ---------------------------------------------------------------------------
// Auto-Update configuration
// ---------------------------------------------------------------------------

export function getDemoAutoUpdateConfig() {
  return {
    success: true,
    config: {
      enabled: true,
      emptyTimeoutMinutes: 30,
      warningIntervals: [15, 10, 5, 1],
      warningMessage:
        "⚠️ Server will restart in {minutes} minute(s) for maintenance. Please log out safely!",
      excludeServers: ["ark-genesis1"],
    },
  };
}

// ---------------------------------------------------------------------------
// Mods overview
// ---------------------------------------------------------------------------

export function getDemoModsOverview() {
  const { containers } = getDemoServers();
  const serverMods: Record<
    string,
    { additionalMods: string[]; excludeSharedMods: boolean }
  > = {};

  containers.forEach((c, i) => {
    serverMods[c.name] = {
      additionalMods: DEMO_MODS.slice(0, 3 + (i % 4)).map((m) => m.id),
      excludeSharedMods: i % 3 === 0,
    };
  });

  return {
    success: true,
    overview: {
      sharedMods: DEMO_MODS.slice(0, 6).map((m) => m.id),
      serverMods,
      totalServers: containers.length,
    },
  };
}

// ---------------------------------------------------------------------------
// Save files
// ---------------------------------------------------------------------------

export function getDemoSaveFiles() {
  const now = Date.now();
  return {
    success: true,
    files: [
      {
        name: "TheIsland.ark",
        path: "/ark/saves/TheIsland/TheIsland.ark",
        size: 134217728,
        lastModified: new Date(now - 3600000).toISOString(),
        type: "map",
      },
      {
        name: "TheIsland_PlayerData.arkprofile",
        path: "/ark/saves/TheIsland/TheIsland_PlayerData.arkprofile",
        size: 8388608,
        lastModified: new Date(now - 1800000).toISOString(),
        type: "player",
      },
      {
        name: "TheIsland_NewTribes.arktribe",
        path: "/ark/saves/TheIsland/TheIsland_NewTribes.arktribe",
        size: 1048576,
        lastModified: new Date(now - 3600000).toISOString(),
        type: "tribe",
      },
      {
        name: "ScorchedEarth.ark",
        path: "/ark/saves/ScorchedEarth/ScorchedEarth.ark",
        size: 96468992,
        lastModified: new Date(now - 7200000).toISOString(),
        type: "map",
      },
      {
        name: "backup_2025-05-28_TheIsland.ark",
        path: "/ark/backups/main-cluster/2025-05-28/TheIsland.ark",
        size: 134217728,
        lastModified: new Date(now - 86400000).toISOString(),
        type: "backup",
      },
      {
        name: "backup_2025-05-28_TheIsland_PlayerData.arkprofile",
        path: "/ark/backups/main-cluster/2025-05-28/TheIsland_PlayerData.arkprofile",
        size: 8388608,
        lastModified: new Date(now - 86400000).toISOString(),
        type: "backup",
      },
    ],
    message: "Save files retrieved successfully",
  };
}

// ---------------------------------------------------------------------------
// Lock status
// ---------------------------------------------------------------------------

export function getDemoLockStatus(): { locked: boolean } {
  return { locked: false };
}
