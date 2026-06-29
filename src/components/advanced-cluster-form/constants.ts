export const AVAILABLE_MAPS = [
  'TheIsland',
  'ScorchedEarth',
  'Aberration',
  'Extinction',
  'Genesis',
  'Genesis2',
  'LostIsland',
  'Fjordur',
  'CrystalIsles',
  'Ragnarok',
  'Valguero'
];

export const POPULAR_MODS = [
  { id: '111111111', name: 'Structures Plus (S+)' },
  { id: '880871931', name: 'Super Structures' },
  { id: '731604991', name: 'StackMeMore' },
  { id: '1404697612', name: 'Dino Storage v2' },
  { id: '1565015734', name: 'Awesome SpyGlass!' },
  { id: '1404697612', name: 'Dino Storage v2' },
  { id: '1565015734', name: 'Awesome SpyGlass!' },
  { id: '1404697612', name: 'Dino Storage v2' },
  { id: '1565015734', name: 'Awesome SpyGlass!' }
];

export const TABS = [
  { id: 'basic', label: 'Basic Settings' },
  { id: 'maps', label: 'Map Selection' },
  { id: 'mods', label: 'Mod Management' },
  { id: 'servers', label: 'Server Configuration' },
  { id: 'ports', label: 'Port Configuration' },
  { id: 'settings', label: 'Game Settings' },
  { id: 'cluster', label: 'Cluster Settings' }
] as const;

export const DEFAULT_FORM_STATE = {
  name: '',
  description: '',
  basePort: 7777,
  serverCount: 1,
  selectedMaps: [] as { map: string; count: number; enabled: boolean }[],
  globalSettings: {
    gameUserSettings: {
      ServerSettings: {
        MaxPlayers: 70,
        DifficultyOffset: 1.0,
        HarvestAmountMultiplier: 2.0,
        TamingSpeedMultiplier: 3.0,
        MatingIntervalMultiplier: 0.5,
        EggHatchSpeedMultiplier: 10.0,
        BabyMatureSpeedMultiplier: 20.0,
        DayCycleSpeedScale: 1.0,
        DayTimeSpeedScale: 1.0,
        NightTimeSpeedScale: 1.0,
        DinoDamageMultiplier: 1.0,
        PlayerDamageMultiplier: 1.0,
        StructureDamageMultiplier: 1.0,
        PlayerResistanceMultiplier: 1.0,
        DinoResistanceMultiplier: 1.0,
        StructureResistanceMultiplier: 1.0,
        XPMultiplier: 2.0,
        AllowThirdPersonPlayer: true,
        AlwaysNotifyPlayerLeft: true,
        AlwaysNotifyPlayerJoined: true,
        ServerCrosshair: true,
        ServerForceNoHUD: false,
        ServerThirdPersonPlayer: false,
        ServerHardcore: false,
        ServerAllowThirdPersonPlayer: true,
        ServerShowMapPlayerLocation: true,
        ServerEnablePvPGamma: true,
        ServerAllowFlyerCarryPvE: true,
        ServerDisableStructurePlacementCollision: true,
        ServerAllowCaveBuildingPvE: true,
        ServerAllowFlyingStaminaRecovery: true,
        ServerAllowUnlimitedRespecs: true,
        ServerPreventSpawnFlier: true,
        ServerPreventOfflinePvP: true,
        ServerPreventOfflinePvPInterval: 300,
        ServerPreventOfflinePvPUseStructurePrevention: true,
        ServerPreventOfflinePvPUseStructurePreventionRadius: 1000
      },
      MultiHome: {
        MultiHome: ""
      },
      SessionSettings: {
        SessionName: "",
        ServerPassword: "",
        ServerAdminPassword: "admin123",
        MaxPlatformSaddleStructureLimit: 130
      }
    },
    gameIni: {
      ServerSettings: {
        AllowCaveBuildingPvE: true,
        AllowFlyingStaminaRecovery: true,
        AllowUnlimitedRespecs: true,
        PreventSpawnFlier: true,
        PreventOfflinePvP: true,
        PreventOfflinePvPInterval: 300,
        PreventOfflinePvPUseStructurePrevention: true,
        PreventOfflinePvPUseStructurePreventionRadius: 1000
      }
    }
  },
  globalMods: [] as string[],
  servers: [] as any[],
  clusterSettings: {
    clusterId: '',
    clusterName: '',
    clusterDescription: '',
    clusterPassword: '',
    clusterOwner: 'Admin'
  },
  portConfiguration: {
    basePort: 7777,
    portIncrement: 1,
    queryPortBase: 27015,
    queryPortIncrement: 1,
    rconPortBase: 32330,
    rconPortIncrement: 1
  },
  autoStart: false
};
