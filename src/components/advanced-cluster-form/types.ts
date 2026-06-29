export interface ServerConfig {
  name: string;
  map: string;
  gamePort: number;
  queryPort: number;
  rconPort: number;
  maxPlayers: number;
  password: string;
  adminPassword: string;
  mods: string[];
  customSettings?: any;
}

export interface MapSelection {
  map: string;
  count: number;
  enabled: boolean;
}

export interface ClusterForm {
  name: string;
  description: string;
  basePort: number;
  serverCount: number;
  selectedMaps: MapSelection[];
  globalSettings: {
    gameUserSettings: {
      ServerSettings: any;
      MultiHome: any;
      SessionSettings: any;
    };
    gameIni: {
      ServerSettings: any;
    };
  };
  globalMods: string[];
  servers: ServerConfig[];
  clusterSettings: {
    clusterId: string;
    clusterName: string;
    clusterDescription: string;
    clusterPassword: string;
    clusterOwner: string;
  };
  portConfiguration: {
    basePort: number;
    portIncrement: number;
    queryPortBase: number;
    queryPortIncrement: number;
    rconPortBase: number;
    rconPortIncrement: number;
  };
  autoStart: boolean;
}

export interface AdvancedClusterFormProps {
  onSubmit: (config: ClusterForm) => void;
  onCancel: () => void;
  loading: boolean;
}
