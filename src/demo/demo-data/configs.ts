import { getDemoServers } from "./servers-clusters";

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
  const allServers = [...getDemoServers().containers, ...getDemoServers().nativeServers];
  const server = allServers.find((s) => s.name === serverName) || allServers[0];

  if (file === "GameUserSettings.ini" || file.includes("GameUserSettings")) {
    return {
      content: GAME_USER_SETTINGS_TEMPLATE.replace(/\{serverName\}/g, server.name)
        .replace(/\{maxPlayers\}/g, String(server.maxPlayers || 70))
        .replace(/\{gamePort\}/g, String(server.gamePort || 7777))
        .replace(/\{queryPort\}/g, String(server.queryPort || 27015))
        .replace(/\{rconPort\}/g, String(server.rconPort || 32330)),
      filename: "GameUserSettings.ini", map: server.map || "TheIsland",
      configPath: `/ark/config/${server.name}/GameUserSettings.ini`,
      filePath: `/ark/config/${server.name}/GameUserSettings.ini`,
      fileName: "GameUserSettings.ini", serverName: server.name,
    };
  }
  return {
    content: GAME_INI_TEMPLATE.replace(/\{maxPlayers\}/g, String(server.maxPlayers || 70)),
    filename: "Game.ini", map: server.map || "TheIsland",
    configPath: `/ark/config/${server.name}/Game.ini`,
    filePath: `/ark/config/${server.name}/Game.ini`,
    fileName: "Game.ini", serverName: server.name,
  };
}

export function getDemoArkConfigFile(serverName: string, fileName: "Game.ini" | "GameUserSettings.ini") {
  const result = getDemoConfigFile(serverName, fileName);
  return { success: true, content: result.content, path: result.filePath };
}

export function getDemoGlobalConfigs() {
  return {
    success: true,
    gameIni: GAME_INI_TEMPLATE.replace(/\{maxPlayers\}/g, "70"),
    gameUserSettingsIni: GAME_USER_SETTINGS_TEMPLATE.replace(/\{serverName\}/g, "Global Default")
      .replace(/\{maxPlayers\}/g, "70").replace(/\{gamePort\}/g, "7777")
      .replace(/\{queryPort\}/g, "27015").replace(/\{rconPort\}/g, "32330"),
  };
}
