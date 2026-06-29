import { api, FRONTEND_ONLY_MODE, ApiError } from "../api-core";
import type { ClusterBackup } from "../api-core";
import { isDemoMode } from "../../demo/demo-core";

function useMockData(): boolean {
  return FRONTEND_ONLY_MODE || isDemoMode();
}

// Provisioning API
export const initializeSystem = async (): Promise<{
  success: boolean;
  message: string;
}> => {
  const response = await api.post<{ success: boolean; message: string }>(
    "/api/provisioning/initialize",
  );
  if (!response.data.success) {
    throw new ApiError("Failed to initialize system", 500, response.data);
  }
  return response.data;
};

export const installSteamCmd = async (): Promise<{
  success: boolean;
  message: string;
}> => {
  const response = await api.post<{ success: boolean; message: string }>(
    "/api/provisioning/install-steamcmd",
  );
  if (!response.data.success) {
    throw new ApiError("Failed to install SteamCMD", 500, response.data);
  }
  return response.data;
};

export const createServer = async (
  serverConfig: Record<string, unknown>,
): Promise<{ success: boolean; message: string; jobId?: string }> => {
  const response = await api.post<{ success: boolean; message: string; jobId?: string }>(
    "/api/provisioning/create-server",
    serverConfig,
  );
  if (!response.data.success) {
    throw new ApiError("Failed to create server", 500, response.data);
  }
  return response.data;
};

export const createCluster = async (
  clusterConfig: Record<string, unknown>,
): Promise<{ success: boolean; message: string }> => {
  const payload = {
    ...clusterConfig,
    name: clusterConfig.clusterName,
  };
  const response = await api.post<{ success: boolean; message: string }>(
    "/api/provisioning/clusters",
    payload,
  );
  if (!response.data.success) {
    throw new ApiError("Failed to create cluster", 500, response.data);
  }
  return response.data;
};

export const getServers = async (): Promise<Array<Record<string, unknown>>> => {
  const response = await api.get<{
    success: boolean;
    servers: Array<Record<string, unknown>>;
  }>("/api/provisioning/servers");
  if (!response.data.success) {
    throw new ApiError("Failed to get servers", 500, response.data);
  }
  return response.data.servers;
};

export const getClusters = async (): Promise<
  Array<Record<string, unknown>>
> => {
  const response = await api.get<{
    success: boolean;
    clusters: Array<Record<string, unknown>>;
  }>("/api/provisioning/clusters");
  if (!response.data.success) {
    throw new ApiError("Failed to get clusters", 500, response.data);
  }
  return response.data.clusters;
};

export const deleteServer = async (
  serverName: string,
): Promise<{ success: boolean; message: string }> => {
  const response = await api.delete<{ success: boolean; message: string }>(
    `/api/provisioning/servers/${encodeURIComponent(serverName)}`,
  );
  if (!response.data.success) {
    throw new ApiError("Failed to delete server", 500, response.data);
  }
  return response.data;
};

export const deleteCluster = async (
  clusterName: string,
  options?: { backupSaved?: boolean; deleteFiles?: boolean },
): Promise<{
  success: boolean;
  message: string;
  data?: Record<string, unknown>;
}> => {
  const params = new URLSearchParams();
  if (options?.backupSaved !== undefined)
    params.append("backupSaved", options.backupSaved.toString());
  if (options?.deleteFiles !== undefined)
    params.append("deleteFiles", options.deleteFiles.toString());

  const url = `/api/provisioning/clusters/${encodeURIComponent(clusterName)}${params.toString() ? `?${params.toString()}` : ""}`;
  const response = await api.delete<{
    success: boolean;
    message: string;
    data?: Record<string, unknown>;
  }>(url);
  if (!response.data.success) {
    throw new ApiError("Failed to delete cluster", 500, response.data);
  }
  return response.data;
};

export const backupCluster = async (
  clusterName: string,
  destination?: string,
): Promise<{
  success: boolean;
  message: string;
  data?: Record<string, unknown>;
}> => {
  const response = await api.post<{
    success: boolean;
    message: string;
    data?: Record<string, unknown>;
  }>(`/api/provisioning/clusters/${encodeURIComponent(clusterName)}/backup`, {
    destination,
  });
  if (!response.data.success) {
    throw new ApiError("Failed to backup cluster", 500, response.data);
  }
  return response.data;
};

export const restoreCluster = async (
  clusterName: string,
  source: string,
): Promise<{
  success: boolean;
  message: string;
  data?: Record<string, unknown>;
}> => {
  const response = await api.post<{
    success: boolean;
    message: string;
    data?: Record<string, unknown>;
  }>(`/api/provisioning/clusters/${encodeURIComponent(clusterName)}/restore`, {
    source,
  });
  if (!response.data.success) {
    throw new ApiError("Failed to restore cluster", 500, response.data);
  }
  return response.data;
};

export const backupServer = async (
  serverName: string,
  options?: {
    destination?: string;
    includeConfigs?: boolean;
    includeScripts?: boolean;
  },
): Promise<{
  success: boolean;
  message: string;
  data?: Record<string, unknown>;
}> => {
  const response = await api.post<{
    success: boolean;
    message: string;
    data?: Record<string, unknown>;
  }>(
    `/api/provisioning/servers/${encodeURIComponent(serverName)}/backup`,
    options || {},
  );
  if (!response.data.success) {
    throw new ApiError("Failed to backup server", 500, response.data);
  }
  return response.data;
};

export const restoreServer = async (
  serverName: string,
  source: string,
  options?: { targetClusterName?: string; overwrite?: boolean },
): Promise<{
  success: boolean;
  message: string;
  data?: Record<string, unknown>;
}> => {
  const response = await api.post<{
    success: boolean;
    message: string;
    data?: Record<string, unknown>;
  }>(`/api/provisioning/servers/${encodeURIComponent(serverName)}/restore`, {
    source,
    ...options,
  });
  if (!response.data.success) {
    throw new ApiError("Failed to restore server", 500, response.data);
  }
  return response.data;
};

export const listServerBackups = async (): Promise<{
  success: boolean;
  message: string;
  data?: Record<string, unknown>;
}> => {
  const response = await api.get<{
    success: boolean;
    message: string;
    data?: Record<string, unknown>;
  }>("/api/provisioning/server-backups");
  if (!response.data.success) {
    throw new ApiError("Failed to list server backups", 500, response.data);
  }
  return response.data;
};

export const updateAllServers = async (): Promise<{
  success: boolean;
  message: string;
}> => {
  const response = await api.post<{ success: boolean; message: string }>(
    "/api/provisioning/update-all-servers",
  );
  if (!response.data.success) {
    throw new ApiError("Failed to update all servers", 500, response.data);
  }
  return response.data;
};

export const regenerateStartScripts = async (): Promise<{
  success: boolean;
  message: string;
  details?: {
    successful: Array<Record<string, unknown>>;
    failed: Array<Record<string, unknown>>;
    totalProcessed: number;
  };
}> => {
  const response = await api.post("/api/provisioning/regenerate-start-scripts");
  return response.data;
};

export const getStartScript = async (
  serverName: string,
): Promise<{
  success: boolean;
  serverName: string;
  clusterName: string;
  scriptPath: string;
  content: string;
  lastModified: string;
}> => {
  const response = await api.get(
    `/api/native-servers/${encodeURIComponent(serverName)}/start-bat`,
  );
  return response.data;
};
