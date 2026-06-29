import type { Container } from "../../services/api-core";

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

export interface DemoServers {
  containers: Container[];
  nativeServers: Container[];
}

export function getDemoServers(): DemoServers {
  const containers: Container[] = [
    { name: "ark-theisland", status: "running", image: "ark:latest", ports: ["7777:7777/udp", "27015:27015/udp", "32330:32330/tcp"], created: daysAgo(45), type: "container", map: "TheIsland", clusterName: "main-cluster", gamePort: 7777, queryPort: 27015, rconPort: 32330, maxPlayers: 70, players: 42, serverCount: 1, serverPath: "/ark/server/TheIsland" },
    { name: "ark-scorched", status: "running", image: "ark:latest", ports: ["7781:7777/udp", "27016:27015/udp", "32331:32330/tcp"], created: daysAgo(42), type: "container", map: "ScorchedEarth", clusterName: "main-cluster", gamePort: 7781, queryPort: 27016, rconPort: 32331, maxPlayers: 70, players: 28, serverPath: "/ark/server/ScorchedEarth" },
    { name: "ark-aberration", status: "running", image: "ark:latest", ports: ["7782:7777/udp", "27017:27015/udp", "32332:32330/tcp"], created: daysAgo(40), type: "container", map: "Aberration", clusterName: "main-cluster", gamePort: 7782, queryPort: 27017, rconPort: 32332, maxPlayers: 70, players: 35, serverPath: "/ark/server/Aberration" },
    { name: "ark-extinction", status: "running", image: "ark:latest", ports: ["7783:7777/udp", "27018:27015/udp", "32333:32330/tcp"], created: daysAgo(38), type: "container", map: "Extinction", clusterName: "main-cluster", gamePort: 7783, queryPort: 27018, rconPort: 32333, maxPlayers: 70, players: 51, serverPath: "/ark/server/Extinction" },
    { name: "ark-genesis1", status: "stopped", image: "ark:latest", ports: ["7784:7777/udp", "27019:27015/udp", "32334:32330/tcp"], created: daysAgo(35), type: "container", map: "Genesis1", clusterName: "main-cluster", gamePort: 7784, queryPort: 27019, rconPort: 32334, maxPlayers: 70, players: 0, serverPath: "/ark/server/Genesis1" },
    { name: "ark-genesis2", status: "running", image: "ark:latest", ports: ["7785:7777/udp", "27020:27015/udp", "32335:32330/tcp"], created: daysAgo(30), type: "container", map: "Genesis2", clusterName: "main-cluster", gamePort: 7785, queryPort: 27020, rconPort: 32335, maxPlayers: 70, players: 19, serverPath: "/ark/server/Genesis2" },
    { name: "ark-fjordur", status: "running", image: "ark:latest", ports: ["7786:7777/udp", "27021:27015/udp", "32336:32330/tcp"], created: daysAgo(25), type: "container", map: "Fjordur", clusterName: "pvp-cluster", gamePort: 7786, queryPort: 27021, rconPort: 32336, maxPlayers: 100, players: 78, serverPath: "/ark/server/Fjordur" },
    { name: "ark-ragnarok", status: "running", image: "ark:latest", ports: ["7787:7777/udp", "27022:27015/udp", "32337:32330/tcp"], created: daysAgo(20), type: "container", map: "Ragnarok", clusterName: "pvp-cluster", gamePort: 7787, queryPort: 27022, rconPort: 32337, maxPlayers: 100, players: 63, serverPath: "/ark/server/Ragnarok" },
    { name: "ark-crystalisles", status: "stopped", image: "ark:latest", ports: ["7788:7777/udp", "27023:27015/udp", "32338:32330/tcp"], created: daysAgo(15), type: "container", map: "CrystalIsles", clusterName: "pvp-cluster", gamePort: 7788, queryPort: 27023, rconPort: 32338, maxPlayers: 100, players: 0, serverPath: "/ark/server/CrystalIsles" },
    { name: "ark-valguero", status: "restarting", image: "ark:latest", ports: ["7789:7777/udp", "27024:27015/udp", "32339:32330/tcp"], created: daysAgo(10), type: "container", map: "Valguero", clusterName: "pvp-cluster", gamePort: 7789, queryPort: 27024, rconPort: 32339, maxPlayers: 100, players: 0, serverPath: "/ark/server/Valguero" },
  ];

  const nativeServers: Container[] = [
    { name: "TheIsland-Primary", status: "running", image: "", ports: ["7777:7777/udp", "27015:27015/udp"], created: daysAgo(120), type: "native", map: "TheIsland", clusterName: "legacy-cluster", gamePort: 7777, queryPort: 27015, rconPort: 32330, maxPlayers: 70, players: 33, serverPath: "C:\\ARK\\ShooterGame\\Binaries\\Win64\\ArkAscendedServer.exe" },
    { name: "Center-PvP", status: "running", image: "", ports: ["7780:7777/udp", "27025:27015/udp"], created: daysAgo(90), type: "native", map: "TheCenter", clusterName: "legacy-cluster", gamePort: 7780, queryPort: 27025, rconPort: 32340, maxPlayers: 80, players: 55, serverPath: "C:\\ARK\\ShooterGame\\Binaries\\Win64\\ArkAscendedServer.exe" },
    { name: "LostIsland-Experimental", status: "stopped", image: "", ports: ["7790:7777/udp", "27026:27015/udp"], created: daysAgo(60), type: "native", map: "LostIsland", clusterName: "legacy-cluster", gamePort: 7790, queryPort: 27026, rconPort: 32341, maxPlayers: 70, players: 0, serverPath: "C:\\ARK\\ShooterGame\\Binaries\\Win64\\ArkAscendedServer.exe" },
  ];

  return { containers, nativeServers };
}

export function getDemoClusters() {
  const { containers, nativeServers } = getDemoServers();
  return [
    { name: "main-cluster", description: "Primary PvE cluster with all story maps. Cross-Ark transfer enabled, 3x harvest, 5x taming.", basePort: 7777, serverCount: containers.filter((c) => c.clusterName === "main-cluster").length, created: daysAgo(45), servers: containers.filter((c) => c.clusterName === "main-cluster").map((c) => ({ name: c.name, gamePort: c.gamePort, status: c.status })) },
    { name: "pvp-cluster", description: "Competitive PvP cluster with larger maps. 10x harvest, 10x taming, weekly events.", basePort: 7786, serverCount: containers.filter((c) => c.clusterName === "pvp-cluster").length, created: daysAgo(25), servers: containers.filter((c) => c.clusterName === "pvp-cluster").map((c) => ({ name: c.name, gamePort: c.gamePort, status: c.status })) },
    { name: "legacy-cluster", description: "Legacy native Windows servers. Direct .exe management, no containerization.", basePort: 7777, serverCount: nativeServers.length, created: daysAgo(120), servers: nativeServers.map((s) => ({ name: s.name, gamePort: s.gamePort, status: s.status })) },
  ];
}
