import type { GameDefinition, GameDefinitionFormData } from "../../types/games";

export interface GameManagerProps {
  onClose: () => void;
}

export const EMPTY_FORM: GameDefinitionFormData = {
  gameType: "",
  displayName: "",
  binaryName: "",
  processNames: "",
  steamAppId: "",
  configFiles: "",
  configSubPath: "",
  defaultGamePort: 7777,
  defaultQueryPort: 27015,
  defaultRconPort: 25575,
  canCluster: false,
  supportsSteamWorkshop: false,
  supportsRcon: true,
  supportsQuery: false,
  binaryExeRelativePath: "",
  installScriptTemplate: "",
  startScriptTemplate: "",
  stopScriptTemplate: "",
};
