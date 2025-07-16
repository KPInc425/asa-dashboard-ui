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
}

export type WizardStep = 'welcome' | 'cluster-basic' | 'map-selection' | 'server-config' | 'game-settings' | 'review' | 'creating';

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