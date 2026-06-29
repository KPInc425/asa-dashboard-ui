export function getDemoSaveFiles() {
  return {
    success: true,
    files: [
      { name: "TheIsland.ark", path: "D:\\ARK\\Servers\\TheIsland\\Saved\\TheIsland.ark", size: 134217728, modified: new Date().toISOString() },
      { name: "TheIsland_Backup.ark", path: "D:\\ARK\\Servers\\TheIsland\\Saved\\TheIsland_Backup.ark", size: 134217728, modified: new Date(Date.now() - 86400000).toISOString() },
    ],
  };
}

export function getDemoLockStatus() {
  return {
    success: true,
    locked: false,
    lockedBy: null,
    lockedAt: null,
    message: "System is unlocked",
  };
}
