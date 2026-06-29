export function getDemoDiscordConfig() {
  return {
    success: true,
    enabled: true,
    webhooks: [
      { id: "wh-server-status", name: "Server Status Updates", url: "https://discord.com/api/webhooks/demo-server-status/xxxxxxxxxx", events: ["server_start", "server_stop", "server_crash", "server_update"], active: true },
      { id: "wh-player-alerts", name: "Player Alerts", url: "https://discord.com/api/webhooks/demo-player-alerts/xxxxxxxxxx", events: ["player_join", "player_leave", "player_ban"], active: true },
      { id: "wh-backup-notify", name: "Backup Notifications", url: "https://discord.com/api/webhooks/demo-backup/xxxxxxxxxx", events: ["backup_start", "backup_complete", "backup_failed"], active: false },
    ],
    bot: { enabled: true, token: "demo-bot-token-xxxxxxxxxx", prefix: "!", applicationId: "123456789012345678", status: "online", latency: 42, serverCount: 10, commandsEnabled: true, allowedChannels: ["general", "server-alerts", "admin-chat"], allowedRoles: ["Admin", "Moderator", "Server Manager"] },
  };
}
