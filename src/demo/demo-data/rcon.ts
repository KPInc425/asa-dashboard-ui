export const DEMO_RCON_RESPONSES: Record<string, string> = {
  listplayers: `1. Player_Alpha (SteamID: 76561197960287930)\n2. BraveBravo (SteamID: 76561197960287931)\n3. CharlieChad (SteamID: 76561197960287932)\n4. DeltaForce (SteamID: 76561197960287933)\n5. EchoEcho (SteamID: 76561197960287934)\n6. Foxtrot_Unity (SteamID: 76561197960287935)\n7. GolfGamer (SteamID: 76561197960287936)\n8. HotelHero (SteamID: 76561197960287937)\n9. India_IX (SteamID: 76561197960287938)\n10. JulietJuliet (SteamID: 76561197960287939)\n11. Kilo_Kilo (SteamID: 76561197960287940)\n12. Lima_Lima (SteamID: 76561197960287941)\nTotal 12 players online`,
  saveworld: "World is now saving... World has been saved.",
  destroywilddinos: "Destroying all wild dinosaurs... Everything is dead. Good work.",
  getgameinfo: `The server is running on map: TheIsland\nSession name: ARK PvE Cluster\nPlayer count: 42/70\nTame count: 1342\nStructure count: 8741\nServer uptime: 3d 14h 23m\nServer FPS: 59.8\nTicking accuracy: 0.9997\nServer Game Time: 482.3 days`,
  showmyadminmanager: `Admin logging is enabled.\nAdmin commands are logged to: /ark/logs/AdminCommands.log\nActive administrators: Demo_Viewer, ServerAdmin, ModManager`,
  "cheat getplayercount": "12",
  "cheat scriptcommand getstats": "Server running at optimal performance. Memory: 8.2/32GB used. CPU: 34%. Network: 12.4MB/s in, 3.2MB/s out.",
};

export function getDemoRconResponse(command: string): string {
  const cmd = command.trim().toLowerCase();
  if (DEMO_RCON_RESPONSES[cmd]) return DEMO_RCON_RESPONSES[cmd];
  return `Command '${command}' executed successfully on server. (Demo mode simulation)`;
}
