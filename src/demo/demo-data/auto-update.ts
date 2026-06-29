export function getDemoAutoUpdateConfig() {
  return {
    success: true,
    config: { enabled: true, emptyTimeoutMinutes: 30, warningIntervals: [15, 10, 5, 1], warningMessage: "⚠️ Server will restart in {minutes} minute(s) for maintenance. Please log out safely!", excludeServers: ["ark-genesis1"] },
  };
}
