/**
 * Server API Functions
 * 
 * Centralized API functions for server-related operations.
 * All functions return properly typed data and handle errors consistently.
 */

import { apiClient } from './apiClient';
import type {
  ServerSummary,
  ServerLiveData,
  ServerActionResult,
} from '../types/serverStatus';
import { normalizeStatus } from '../types/serverStatus';

// Re-export types for convenience
export type { ServerSummary, ServerLiveData, ServerActionResult };

/**
 * API response wrapper for server list
 */
interface ServersResponse {
  success: boolean;
  servers?: ServerSummary[];
  containers?: ServerSummary[];
}

/**
 * API response wrapper for server status
 */
interface StatusResponse {
  success: boolean;
  status?: {
    status: string;
    running?: boolean;
    source?: string;
    updatedAt?: string;
    crashInfo?: unknown;
    players?: { online: number; max: number };
    performance?: { cpu?: number; memory?: number; uptime?: number };
  };
  running?: boolean;
}

/**
 * Fetch all native servers
 */
export async function fetchNativeServers(): Promise<ServerSummary[]> {
  const response = await apiClient.get<ServersResponse>('/api/native-servers');
  return (response.data.servers || []).map(normalizeServerSummary);
}

/**
 * Fetch all containers
 */
export async function fetchContainers(): Promise<ServerSummary[]> {
  const response = await apiClient.get<ServersResponse>('/api/containers');
  return (response.data.containers || []).map(normalizeServerSummary);
}

/**
 * Fetch all servers (both native and containers, deduplicated)
 * Native servers take priority over containers with the same name
 */
export async function fetchServers(): Promise<ServerSummary[]> {
  const [nativeServersResponse, containersResponse] = await Promise.all([
    apiClient.get<ServersResponse>('/api/native-servers').catch(() => ({ data: { servers: [] } })),
    apiClient.get<ServersResponse>('/api/containers').catch(() => ({ data: { containers: [] } })),
  ]);

  const nativeServers = (nativeServersResponse.data.servers || []).map(normalizeServerSummary);
  const containers = (containersResponse.data.containers || []).map(normalizeServerSummary);

  // Combine and deduplicate - native servers take priority
  const allServers = [...nativeServers];
  const nativeNames = new Set(nativeServers.map((s) => s.name));

  for (const container of containers) {
    if (!nativeNames.has(container.name)) {
      allServers.push(container);
    }
  }

  return allServers;
}

/**
 * Fetch details for a specific server
 */
export async function fetchServerDetails(serverId: string): Promise<ServerSummary | null> {
  // Try native servers first
  try {
    const nativeServers = await fetchNativeServers();
    const found = nativeServers.find((s) => s.name === serverId);
    if (found) return found;
  } catch {
    // Continue to try containers
  }

  // Try containers
  try {
    const containers = await fetchContainers();
    const found = containers.find((s) => s.name === serverId);
    if (found) return found;
  } catch {
    // Server not found in either
  }

  return null;
}

/**
 * Fetch live server data (status, players, performance)
 */
export async function fetchServerLiveData(
  serverId: string,
  serverType: 'native' | 'container' = 'native'
): Promise<ServerLiveData> {
  const endpoint =
    serverType === 'container'
      ? `/api/containers/${encodeURIComponent(serverId)}/status`
      : `/api/native-servers/${encodeURIComponent(serverId)}/status`;

  const response = await apiClient.get<StatusResponse>(endpoint);

  // Transform response to ServerLiveData format
  const statusData = response.data.status;
  
  return {
    serverId,
    status: normalizeStatus(statusData?.status || 'unknown'),
    players: statusData?.players || { online: 0, max: 0 },
    performance: statusData?.performance,
    updatedAt: statusData?.updatedAt || new Date().toISOString(),
    source: (statusData?.source as 'process' | 'rcon' | 'query' | 'cached') || 'cached',
    crashInfo: statusData?.crashInfo as ServerLiveData['crashInfo'],
  };
}

/**
 * Check if a server is running
 */
export async function isServerRunning(
  serverId: string,
  serverType: 'native' | 'container' = 'native'
): Promise<boolean> {
  const endpoint =
    serverType === 'container'
      ? `/api/containers/${encodeURIComponent(serverId)}/running`
      : `/api/native-servers/${encodeURIComponent(serverId)}/running`;

  try {
    const response = await apiClient.get<{ success: boolean; running: boolean }>(endpoint);
    return response.data.success && response.data.running;
  } catch {
    return false;
  }
}

/**
 * Start a server
 */
export async function startServer(
  serverId: string,
  serverType: 'native' | 'container' = 'native'
): Promise<ServerActionResult> {
  const endpoint =
    serverType === 'container'
      ? `/api/containers/${encodeURIComponent(serverId)}/start`
      : `/api/native-servers/${encodeURIComponent(serverId)}/start`;

  const response = await apiClient.post<ServerActionResult>(endpoint);
  return response.data;
}

/**
 * Stop a server
 */
export async function stopServer(
  serverId: string,
  serverType: 'native' | 'container' = 'native'
): Promise<ServerActionResult> {
  const endpoint =
    serverType === 'container'
      ? `/api/containers/${encodeURIComponent(serverId)}/stop`
      : `/api/native-servers/${encodeURIComponent(serverId)}/stop`;

  const response = await apiClient.post<ServerActionResult>(endpoint);
  return response.data;
}

/**
 * Restart a server
 */
export async function restartServer(
  serverId: string,
  serverType: 'native' | 'container' = 'native'
): Promise<ServerActionResult> {
  const endpoint =
    serverType === 'container'
      ? `/api/containers/${encodeURIComponent(serverId)}/restart`
      : `/api/native-servers/${encodeURIComponent(serverId)}/restart`;

  const response = await apiClient.post<ServerActionResult>(endpoint);
  return response.data;
}

/**
 * Send RCON command to a server
 */
export async function sendRconCommand(
  serverId: string,
  command: string,
  serverType: 'native' | 'container' = 'native'
): Promise<{ success: boolean; response?: string; message?: string }> {
  const endpoint =
    serverType === 'container'
      ? `/api/containers/${encodeURIComponent(serverId)}/rcon`
      : `/api/native-servers/${encodeURIComponent(serverId)}/rcon`;

  const response = await apiClient.post<{
    success: boolean;
    response?: string;
    message?: string;
  }>(endpoint, { command });

  return response.data;
}

/**
 * Save world before performing an action
 */
export async function saveWorld(
  serverId: string,
  serverType: 'native' | 'container' = 'native'
): Promise<boolean> {
  try {
    const result = await sendRconCommand(serverId, 'saveworld', serverType);
    return result.success;
  } catch {
    return false;
  }
}

/**
 * Stop server with automatic save
 */
export async function safeStopServer(
  serverId: string,
  serverType: 'native' | 'container' = 'native'
): Promise<ServerActionResult> {
  // Try to save first
  await saveWorld(serverId, serverType);
  // Wait a moment for save to complete
  await new Promise((resolve) => setTimeout(resolve, 2000));
  // Then stop
  return stopServer(serverId, serverType);
}

/**
 * Restart server with automatic save
 */
export async function safeRestartServer(
  serverId: string,
  serverType: 'native' | 'container' = 'native'
): Promise<ServerActionResult> {
  // Try to save first
  await saveWorld(serverId, serverType);
  // Wait a moment for save to complete
  await new Promise((resolve) => setTimeout(resolve, 2000));
  // Then restart
  return restartServer(serverId, serverType);
}

/**
 * Normalize server summary data
 */
function normalizeServerSummary(server: ServerSummary): ServerSummary {
  return {
    ...server,
    status: normalizeStatus(server.status as string),
  };
}

/**
 * Server API object for convenient access
 */
export const serverApi = {
  fetchServers,
  fetchNativeServers,
  fetchContainers,
  fetchServerDetails,
  fetchServerLiveData,
  isServerRunning,
  startServer,
  stopServer,
  restartServer,
  safeStopServer,
  safeRestartServer,
  sendRconCommand,
  saveWorld,
};

export default serverApi;
