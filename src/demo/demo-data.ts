/**
 * Demo Data
 *
 * This file is a re-export from the demo-data/ directory.
 * The module has been refactored into smaller focused modules.
 */
export {
  DEMO_USER,
  ARK_MAPS,
  getDemoServers,
  getDemoClusters,
  getDemoSystemInfo,
  getDemoServerStatus,
  getDemoConfigFile,
  getDemoArkConfigFile,
  getDemoGlobalConfigs,
  getDemoStartBat,
  DEMO_RCON_RESPONSES,
  getDemoRconResponse,
  DEMO_MODS,
  getDemoModsOverview,
  getDemoSystemLogs,
  getDemoServerLogs,
  getDemoDiscordConfig,
  getDemoAutoUpdateConfig,
  getDemoSaveFiles,
  getDemoLockStatus,
} from './demo-data/index';

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
