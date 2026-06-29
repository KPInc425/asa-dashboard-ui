export interface Cluster {
  name: string;
  path: string;
  created?: string;
  config?: {
    description?: string;
    maps?: string[];
    clusterPassword?: string;
    customDynamicConfigUrl?: string;
    servers?: Array<{
      name: string;
      status: string;
      map: string;
      gamePort: number;
      queryPort: number;
      rconPort: number;
    }>;
  };
}

export type ClusterBackup = {
  clusterName: string;
  backupName: string;
  created: string;
  backupPath: string;
  size: number;
  type: string;
  hasMetadata: boolean;
};

export type ServerBackup = {
  serverName: string;
  backupName: string;
  created: string;
  backupPath: string;
  size: number;
  type: string;
  hasMetadata: boolean;
};
