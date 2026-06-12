export interface GameDefinition {
  id: string;              // game_type, e.g. 'vrising', 'my-custom-game'
  name: string;            // display name, e.g. 'V Rising'
  binaryName: string;      // Server executable, e.g. 'VRisingServer.exe'
  processNames: string[];  // e.g. ['VRisingServer', 'VRisingServer.exe']
  steamAppId: string | null;
  configFiles: string[];   // e.g. ['ServerGameSettings.json', 'ServerHostSettings.json']
  configSubPath: string;   // e.g. '' or 'Config/WindowsServer'
  defaultPorts: {
    game: number;
    query: number;
    rcon: number;
  };
  capabilities: {
    canCluster: boolean;
    supportsSteamWorkshop: boolean;
    supportsRcon: boolean;
    supportsQuery: boolean;
  };
  binaryExeRelativePath?: string;
  installScriptTemplate?: string;
  startScriptTemplate?: string;
  stopScriptTemplate?: string;
  dynamic: boolean;        // true = user-created, false = built-in
}

export interface GameDefinitionsResponse {
  success: boolean;
  games: GameDefinition[];
  count: number;
}

export interface GameDefinitionResponse {
  success: boolean;
  game: GameDefinition;
}

export interface GameDefinitionFormData {
  gameType: string;
  displayName: string;
  binaryName: string;
  processNames: string;      // comma-separated, will be split to array
  steamAppId: string;
  configFiles: string;       // comma-separated
  configSubPath: string;
  defaultGamePort: number;
  defaultQueryPort: number;
  defaultRconPort: number;
  canCluster: boolean;
  supportsSteamWorkshop: boolean;
  supportsRcon: boolean;
  supportsQuery: boolean;
  binaryExeRelativePath: string;
  installScriptTemplate: string;
  startScriptTemplate: string;
  stopScriptTemplate: string;
}
