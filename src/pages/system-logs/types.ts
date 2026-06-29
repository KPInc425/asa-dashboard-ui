export interface LogFile {
  content: string;
  path: string;
  exists: boolean;
}

export interface SystemLogs {
  combined?: LogFile;
  error?: LogFile;
  asaApiService?: LogFile;
  nodeOut?: LogFile;
  nodeErr?: LogFile;
  serviceOut?: LogFile;
  serviceErr?: LogFile;
  api?: { content: string };
  server?: { content: string };
  docker?: { content: string };
  logFiles?: Record<string, LogFile>;
}

export interface ServiceInfo {
  mode: "native" | "docker";
  isWindowsService: boolean;
  serviceInstallPath: string | null;
  logBasePath: string;
  currentWorkingDirectory: string;
  processId: number;
  parentProcessId: number;
}

export interface LogTab {
  key: string;
  sourceKey: string;
  label: string;
  icon: string;
}
