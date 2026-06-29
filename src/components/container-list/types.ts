import type { Container } from '../../services';

export interface Port {
  IP?: string;
  PrivatePort: number;
  PublicPort?: number;
  Type: string;
}

export interface ContainerListState {
  containers: Container[];
  systemContainers: Container[];
  isLoading: boolean;
  error: string;
  actionLoading: string | null;
  showHidden: boolean;
  hidden: string[];
  isAddingServer: boolean;
  isEditingServer: boolean;
  selectedServer: any;
  serverConfigs: any[];
  showModManager: boolean;
}
