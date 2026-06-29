export interface NativeServerConfig {
  serverPath: string;
  mapName: string;
  gamePort: number;
  queryPort: number;
  rconPort: number;
  serverName: string;
  maxPlayers: number;
  serverPassword: string;
  adminPassword: string;
  mods: string[];
  additionalArgs: string;
  disableBattleEye: boolean;
}

export interface NativeServer {
  name: string;
  status: string;
  image: string;
  ports: string;
  created: string;
  type?: 'individual' | 'cluster' | 'cluster-server';
  serverCount?: number;
  maps?: string;
  config?: NativeServerConfig;
  clusterName?: string;
  map?: string;
  gamePort?: number;
  queryPort?: number;
  rconPort?: number;
  maxPlayers?: number;
  serverPath?: string;
}
