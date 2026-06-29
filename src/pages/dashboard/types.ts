export interface Cluster {
  name: string;
  description: string;
  basePort: number;
  serverCount: number;
  created: string;
  servers: any[];
  path?: string;
  config?: any;
}

export interface NativeServer {
  name: string;
  status: string;
  image: string;
  created: string;
  type: string;
  clusterName?: string;
  map?: string;
  gamePort?: number;
  queryPort?: number;
  rconPort?: number;
  maxPlayers?: number;
  serverPath?: string;
  config?: any;
  isClusterServer?: boolean;
  disableBattleEye?: boolean;
  password?: string;
  adminPassword?: string;
  clusterId?: string;
  clusterPassword?: string;
  clusterOwner?: string;
  gameUserSettings?: any;
  gameIni?: any;
  modManagement?: any;
}

export interface DashboardStats {
  totalServers: number;
  runningServers: number;
  stoppedServers: number;
  totalPlayers: number;
  totalClusters: number;
}

export interface DebugInfo {
  timestamp: string;
  environment: any;
  config: any;
  provisioner: any;
  clusters: any[];
  errors: string[];
}
