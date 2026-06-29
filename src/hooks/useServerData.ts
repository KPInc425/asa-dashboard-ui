/**
 * useServerData
 *
 * This file is a re-export from the use-server-data/ directory.
 * The module has been refactored into smaller focused modules.
 */
export {
  usePageVisibility,
  useServers,
  useServerDetails,
  useServerLiveData,
  useServerLiveDataDynamic,
  useServerRunning,
  useServerMutation,
  useStartServer,
  useStopServer,
  useSafeStopServer,
  useRestartServer,
  useSafeRestartServer,
  usePrefetchServerData,
  getPollingInterval,
  POLLING_INTERVALS,
  TRANSITION_THRESHOLDS,
  serverQueryKeys,
} from './use-server-data/index';
export type { TransitionTracker, ServerAction } from './use-server-data/types';
        queryFn: () => fetchServerLiveData(serverId, serverType),
        staleTime: 2_000,
      });
    },
  };
}

/**
 * Hook to manually refetch server data
 */
export function useRefetchServers() {
  const queryClient = useQueryClient();

  return {
    refetchAll: () =>
      queryClient.invalidateQueries({ queryKey: serverQueryKeys.all }),
    refetchList: () =>
      queryClient.invalidateQueries({ queryKey: serverQueryKeys.list() }),
    refetchServer: (serverId: string) => {
      queryClient.invalidateQueries({
        queryKey: serverQueryKeys.detail(serverId),
      });
      queryClient.invalidateQueries({
        queryKey: serverQueryKeys.live(serverId),
      });
      queryClient.invalidateQueries({
        queryKey: serverQueryKeys.running(serverId),
      });
    },
  };
}

export default {
  useServers,
  useServerDetails,
  useServerLiveData,
  useServerLiveDataDynamic,
  useServerRunning,
  useServerMutation,
  useStartServer,
  useStopServer,
  useSafeStopServer,
  useRestartServer,
  useSafeRestartServer,
  usePrefetchServerData,
  useRefetchServers,
  usePageVisibility,
  getPollingInterval,
  serverQueryKeys,
  POLLING_INTERVALS,
  TRANSITION_THRESHOLDS,
};
