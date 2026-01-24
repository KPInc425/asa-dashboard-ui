import { useState, useEffect, useCallback, useRef } from 'react';
import { autoUpdateApi } from '../services/api-auto-update';
import { socketService } from '../services/socket';
import type {
  AutoUpdateConfig,
  AutoUpdateServerConfig,
  UpdateStatus,
  UpdateProgress,
  AutoUpdateSocketEvent
} from '../types/autoUpdate';

/**
 * Custom hook for auto-update state management
 * Provides real-time auto-update status via socket events
 */
export interface UseAutoUpdateOptions {
  /** Server name to watch (optional - if not provided, watches all servers) */
  serverName?: string;
  /** Enable real-time socket updates */
  realtime?: boolean;
  /** Auto-refresh interval in milliseconds (0 to disable) */
  refreshInterval?: number;
}

export interface UseAutoUpdateResult {
  /** Global auto-update configuration */
  config: AutoUpdateConfig | null;
  /** Server-specific configuration (when serverName is provided) */
  serverConfig: AutoUpdateServerConfig | null;
  /** Current update status */
  status: UpdateStatus;
  /** Current update progress */
  progress: UpdateProgress | null;
  /** Whether data is loading */
  loading: boolean;
  /** Error message if any */
  error: string | null;
  /** Whether an update is available */
  updateAvailable: boolean;
  /** Refresh the data */
  refresh: () => Promise<void>;
  /** Toggle auto-update for the server */
  toggleEnabled: (enabled: boolean) => Promise<boolean>;
  /** Check for updates */
  checkForUpdates: () => Promise<boolean>;
  /** Trigger an update */
  triggerUpdate: (force?: boolean) => Promise<boolean>;
  /** Cancel an ongoing update */
  cancelUpdate: () => Promise<boolean>;
}

export function useAutoUpdate(options: UseAutoUpdateOptions = {}): UseAutoUpdateResult {
  const { serverName, realtime = true, refreshInterval = 0 } = options;

  // State
  const [config, setConfig] = useState<AutoUpdateConfig | null>(null);
  const [serverConfig, setServerConfig] = useState<AutoUpdateServerConfig | null>(null);
  const [status, setStatus] = useState<UpdateStatus>('idle');
  const [progress, setProgress] = useState<UpdateProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  // Refs
  const refreshIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch data
  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch global config
      const configResponse = await autoUpdateApi.getConfig();
      if (configResponse.success) {
        setConfig(configResponse.config);
      }

      // Fetch server-specific data if serverName is provided
      if (serverName) {
        const [serverConfigResponse, statusResponse] = await Promise.all([
          autoUpdateApi.getServerConfig(serverName),
          autoUpdateApi.getStatus(serverName)
        ]);

        if (serverConfigResponse.success) {
          setServerConfig(serverConfigResponse.config);
        }

        if (statusResponse.success) {
          setStatus(statusResponse.status);
          setUpdateAvailable(statusResponse.updateAvailable);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch auto-update data');
    } finally {
      setLoading(false);
    }
  }, [serverName]);

  // Initial load
  useEffect(() => {
    refresh();
  }, [refresh]);

  // Setup auto-refresh
  useEffect(() => {
    if (refreshInterval > 0) {
      refreshIntervalRef.current = setInterval(refresh, refreshInterval);
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [refresh, refreshInterval]);

  // Setup socket listeners for real-time updates
  useEffect(() => {
    if (!realtime) return;

    const handleProgressEvent = (data: AutoUpdateSocketEvent) => {
      // Filter by server if specified
      if (serverName && data.serverName !== serverName) return;

      setStatus(data.data.status);
      setProgress(data.data);

      // Update available flag on certain events
      if (data.type === 'completed') {
        setUpdateAvailable(false);
      }
    };

    const handleStatusEvent = (data: AutoUpdateSocketEvent) => {
      if (serverName && data.serverName !== serverName) return;
      setStatus(data.data.status);
    };

    // Socket events use colons to match backend: auto-update:progress, auto-update:checking, etc.
    socketService.onCustomEvent('auto-update:progress', handleProgressEvent);
    socketService.onCustomEvent('auto-update:checking', handleStatusEvent);
    socketService.onCustomEvent('auto-update:available', handleStatusEvent);
    socketService.onCustomEvent('auto-update:warning', handleProgressEvent);
    socketService.onCustomEvent('auto-update:starting', handleProgressEvent);
    socketService.onCustomEvent('auto-update:completed', handleProgressEvent);
    socketService.onCustomEvent('auto-update:failed', handleProgressEvent);

    return () => {
      socketService.offCustomEvent('auto-update:progress', handleProgressEvent);
      socketService.offCustomEvent('auto-update:checking', handleStatusEvent);
      socketService.offCustomEvent('auto-update:available', handleStatusEvent);
      socketService.offCustomEvent('auto-update:warning', handleProgressEvent);
      socketService.offCustomEvent('auto-update:starting', handleProgressEvent);
      socketService.offCustomEvent('auto-update:completed', handleProgressEvent);
      socketService.offCustomEvent('auto-update:failed', handleProgressEvent);
    };
  }, [realtime, serverName]);

  // Toggle enabled
  const toggleEnabled = useCallback(async (enabled: boolean): Promise<boolean> => {
    if (!serverName) return false;

    try {
      const response = await autoUpdateApi.updateServerConfig(serverName, { enabled });
      if (response.success) {
        setServerConfig(prev => prev ? { ...prev, enabled } : null);
        return true;
      }
      return false;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle auto-update');
      return false;
    }
  }, [serverName]);

  // Check for updates
  const checkForUpdates = useCallback(async (): Promise<boolean> => {
    if (!serverName) return false;

    try {
      setStatus('checking');
      const response = await autoUpdateApi.checkForUpdates(serverName);
      
      if (response.success) {
        setUpdateAvailable(response.updateAvailable);
        setStatus('idle');
        return true;
      }
      
      setStatus('idle');
      return false;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check for updates');
      setStatus('idle');
      return false;
    }
  }, [serverName]);

  // Trigger update
  const triggerUpdate = useCallback(async (force?: boolean): Promise<boolean> => {
    if (!serverName) return false;

    try {
      const response = await autoUpdateApi.triggerUpdate(serverName, force);
      
      if (response.success) {
        setStatus('warning');
        return true;
      }
      
      return false;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to trigger update');
      return false;
    }
  }, [serverName]);

  // Cancel update
  const cancelUpdate = useCallback(async (): Promise<boolean> => {
    if (!serverName) return false;

    try {
      const response = await autoUpdateApi.cancelUpdate(serverName);
      
      if (response.success) {
        setStatus('idle');
        setProgress(null);
        return true;
      }
      
      return false;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel update');
      return false;
    }
  }, [serverName]);

  return {
    config,
    serverConfig,
    status,
    progress,
    loading,
    error,
    updateAvailable,
    refresh,
    toggleEnabled,
    checkForUpdates,
    triggerUpdate,
    cancelUpdate
  };
}

/**
 * Hook for watching all servers' auto-update status
 */
export function useAllServersUpdateStatus() {
  const [statuses, setStatuses] = useState<Record<string, UpdateStatus>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const response = await autoUpdateApi.getAllStatus();
      
      if (response.success) {
        const statusMap: Record<string, UpdateStatus> = {};
        for (const [name, data] of Object.entries(response.servers)) {
          statusMap[name] = data.status;
        }
        setStatuses(statusMap);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch server statuses');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Socket listeners for real-time updates
  useEffect(() => {
    const handleStatusEvent = (data: AutoUpdateSocketEvent) => {
      setStatuses(prev => ({
        ...prev,
        [data.serverName]: data.data.status
      }));
    };

    // Listen to all status-changing events using colon separator
    socketService.onCustomEvent('auto-update:checking', handleStatusEvent);
    socketService.onCustomEvent('auto-update:available', handleStatusEvent);
    socketService.onCustomEvent('auto-update:warning', handleStatusEvent);
    socketService.onCustomEvent('auto-update:starting', handleStatusEvent);
    socketService.onCustomEvent('auto-update:completed', handleStatusEvent);
    socketService.onCustomEvent('auto-update:failed', handleStatusEvent);

    return () => {
      socketService.offCustomEvent('auto-update:checking', handleStatusEvent);
      socketService.offCustomEvent('auto-update:available', handleStatusEvent);
      socketService.offCustomEvent('auto-update:warning', handleStatusEvent);
      socketService.offCustomEvent('auto-update:starting', handleStatusEvent);
      socketService.offCustomEvent('auto-update:completed', handleStatusEvent);
      socketService.offCustomEvent('auto-update:failed', handleStatusEvent);
    };
  }, []);

  return { statuses, loading, error, refresh };
}

export default useAutoUpdate;
