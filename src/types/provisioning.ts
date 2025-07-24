export interface SystemInfo {
  diskSpace: {
    total: number;
    free: number;
    used: number;
    usagePercent: number;
    drive?: string;
  };
  memory: {
    total: number;
    free: number;
    used: number;
    usagePercent: number;
  };
  steamCmdInstalled: boolean;
  steamCmdPath?: string;
  basePath: string;
  platform: string;
  arch: string;
  nodeVersion: string;
  cpuCores: number;
}

export interface Cluster {
  name: string;
  path: string;
  config: {
    description?: string;
    serverCount?: number;
    basePort?: number;
    maxPlayers?: number;
    adminPassword?: string;
    clusterPassword?: string;
    harvestMultiplier?: number;
    xpMultiplier?: number;
    tamingMultiplier?: number;
    servers?: any[];
  };
  created: string;
}

export interface ServerConfig {
  name: string;
  map: string;
  gamePort: number;
  queryPort: number;
  rconPort: number;
  maxPlayers: number;
  adminPassword: string;
  serverPassword: string;
  rconPassword: string;
  harvestMultiplier: number;
  xpMultiplier: number;
  tamingMultiplier: number;
  nameSuffix?: string;
  sessionName?: string;
  status?: string; // Added for cluster status calculations
}

export type WizardStep = 'welcome' | 'cluster-basic' | 'map-selection' | 'server-config' | 'individual-servers' | 'game-settings' | 'mods' | 'review' | 'creating';

export interface WizardData {
  clusterName: string;
  description: string;
  serverCount: number;
  basePort: number;
  portAllocationMode: 'sequential' | 'even';
  selectedMaps: Array<{map: string, count: number, enabled: boolean, displayName?: string}>;
  customMapName: string;
  customMapDisplayName: string;
  customMapCount: number;
  globalSessionName: string;
  maxPlayers: number;
  adminPassword: string;
  serverPassword: string;
  clusterPassword: string;
  harvestMultiplier: number;
  xpMultiplier: number;
  tamingMultiplier: number;
  servers: ServerConfig[];
  foreground: boolean;
  sessionNameMode: 'auto' | 'custom';
  customDynamicConfigUrl: string;
  disableBattleEye: boolean;
  
  // Enhanced configuration options
  individualServerSettings: boolean;
  serverConfigs: Array<{
    name: string;
    map: string;
    gamePort: number;
    queryPort: number;
    rconPort: number;
    maxPlayers: number;
    adminPassword: string;
    serverPassword: string;
    sessionName: string;
    customSettings?: any;
  }>;
  
  // Detailed game settings
  gameSettings: {
    harvestMultiplier: number;
    xpMultiplier: number;
    tamingMultiplier: number;
    matingIntervalMultiplier: number;
    eggHatchSpeedMultiplier: number;
    babyMatureSpeedMultiplier: number;
    dayCycleSpeedScale: number;
    dayTimeSpeedScale: number;
    nightTimeSpeedScale: number;
    dinoDamageMultiplier: number;
    playerDamageMultiplier: number;
    structureDamageMultiplier: number;
    playerResistanceMultiplier: number;
    dinoResistanceMultiplier: number;
    structureResistanceMultiplier: number;
    difficultyOffset: number;
    allowThirdPersonPlayer: boolean;
    alwaysNotifyPlayerLeft: boolean;
    alwaysNotifyPlayerJoined: boolean;
    serverCrosshair: boolean;
    serverForceNoHUD: boolean;
    serverThirdPersonPlayer: boolean;
    serverHardcore: boolean;
    serverShowMapPlayerLocation: boolean;
    serverEnablePvPGamma: boolean;
    serverAllowFlyerCarryPvE: boolean;
    serverDisableStructurePlacementCollision: boolean;
    serverAllowCaveBuildingPvE: boolean;
    serverAllowFlyingStaminaRecovery: boolean;
    serverAllowUnlimitedRespecs: boolean;
    serverPreventSpawnFlier: boolean;
    serverPreventOfflinePvP: boolean;
    serverPreventOfflinePvPInterval: number;
    serverPreventOfflinePvPUseStructurePrevention: boolean;
    serverPreventOfflinePvPUseStructurePreventionRadius: number;
    maxPlatformSaddleStructureLimit: number;
  };
  
  // Mod management
  globalMods: string[];
  serverMods: Record<string, {
    additionalMods: string[];
    excludeSharedMods: boolean;
  }>;
  
  // Port configuration
  portConfiguration: {
    basePort: number;
    portIncrement: number;
    queryPortBase: number;
    queryPortIncrement: number;
    rconPortBase: number;
    rconPortIncrement: number;
  };
  
  // Cluster settings
  clusterSettings: {
    clusterId: string;
    clusterName: string;
    clusterDescription: string;
    clusterPassword: string;
    clusterOwner: string;
  };
  
  autoStart: boolean;
  // Add these fields for INI/config sync
  gameIni?: string;
  gameUserSettingsIni?: string;
}

export interface StepProps {
  wizardData: WizardData;
  setWizardData: React.Dispatch<React.SetStateAction<WizardData>>;
  availableMaps: Array<{name: string, displayName: string, available: boolean}>;
  toggleMap?: (mapName: string) => void;
  updateMapCount?: (mapName: string, count: number) => void;
  generateServers: () => ServerConfig[];
}

export interface CreatingStepProps {
  jobId?: string | null;
  jobProgress?: any | null;
} 