import { getDemoServers } from "./servers-clusters";

export function getDemoStartBat(serverName: string) {
  const server = getDemoServers().containers.concat(getDemoServers().nativeServers).find((s) => s.name === serverName);
  return {
    success: true,
    content: `@echo off\ntitle ARK: Survival Ascended - ${server?.map || "TheIsland"}\nset "SessionName=${server?.name || "ARK Server"}"\nset "ServerMap=${server?.map || "TheIsland"}"\nset "Port=${server?.gamePort || 7777}"\nset "QueryPort=${server?.queryPort || 27015}"\nset "MaxPlayers=${server?.maxPlayers || 70}"\nset "RCONPort=${server?.rconPort || 32330}"\nset "ClusterDirOverride=D:\\ARK\\Clusters"\n\nstart /high /affinity FFF ArkAscendedServer.exe ^\n  %ServerMap%?listen?SessionName=%SessionName%?Port=%Port%?QueryPort=%QueryPort%?MaxPlayers=%MaxPlayers% ^\n  -server -log -USEALLAVAILABLECORES -CULTUREFORENGINEERING -NoBattlEye ^\n  -ClusterDirOverride=%ClusterDirOverride% ^\n  -RCONPort=%RCONPort% -WinLiveMaxPlayers=%MaxPlayers%\n`,
    path: `D:\\ARK\\Servers\\${serverName}\\start.bat`,
  };
}
