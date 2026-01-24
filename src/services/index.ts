// Export all API services
export * from './api';
export { default as apiService } from './api';

// Export all Socket.IO services
export * from './socket';
export { default as socketService } from './socket';

// Export auto-update API service
export * from './api-auto-update';
export { default as autoUpdateApi } from './api-auto-update';

// Re-export commonly used types from core
export type {
  Container,
  RconResponse,
  ConfigFile,
  LockStatus,
  AuthResponse,
  User,
  ClusterBackup,
  LogFile,
  LogFilesResponse,
  LogContentResponse,
  EnvironmentFile,
  DockerComposeFile,
  ArkServer,
  ArkServerConfigs,
  Mod,
  ModsResponse,
} from './api-core';

export type { LogMessage } from './socket'; 