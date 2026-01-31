/**
 * Server Data Hooks
 * 
 * React Query hooks for server data fetching and caching.
 * These hooks provide:
 * - Automatic caching and deduplication
 * - Background refetching
 * - Dynamic polling based on server status
 * - Transition-aware polling with exponential backoff
 * - Optimistic updates for mutations
 * - Browser visibility-aware polling
 * 
 * Polling Behavior by Status:
 * - starting/stopping: 2s (transition states need fast updates)
 * - failed/unknown: 10s (recovery monitoring)
 * - running: 5s if stale, 30s normal (moderate for player counts)
 * - stopped: 60s (just for unexpected state changes)
 * 
 * Usage:
 * ```tsx
 * import { useServers, useServerLiveDataDynamic, useServerMutation } from '../hooks/useServerData';
 * 
 * function ServerList() {
 *   const { data: servers, isLoading, error } = useServers();
 *   const { mutate: startServer } = useServerMutation('start');
 *   
 *   return (
 *     <div>
 *       {servers?.map(server => (
 *         <button onClick={() => startServer(server.name)}>
 *           Start {server.name}
 *         </button>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */

import { useState, useEffect, useRef } from 'react';
import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions,
} from '@tanstack/react-query';
import {
  fetchServers,
  fetchServerDetails,
  fetchServerLiveData,
  startServer,
  stopServer,
  restartServer,
  safeStopServer,
  safeRestartServer,
  isServerRunning,
} from '../api/serverApi';
import type { ServerSummary, ServerLiveData, ServerActionResult } from '../api/serverApi';
import { ApiError } from '../api/apiClient';
import { ServerStatus, isDataStale } from '../types/serverStatus';

// ============================================================================
// POLLING CONFIGURATION
// ============================================================================

/** Polling intervals in milliseconds by server status */
export const POLLING_INTERVALS = {
  /** Transition states - poll frequently for immediate feedback */
  TRANSITION: 2000,
  /** Failed/unknown states - poll for recovery */
  RECOVERY: 10000,
  /** Running and stale data - poll more frequently */
  RUNNING_STALE: 5000,
  /** Running with fresh data - moderate polling */
  RUNNING_NORMAL: 30000,
  /** Stopped servers - slow polling for unexpected changes */
  STOPPED: 60000,
  /** Default fallback */
  DEFAULT: 30000,
} as const;

/** Transition timing thresholds in milliseconds */
export const TRANSITION_THRESHOLDS = {
  /** After this time in transition, start backing off */
  BACKOFF_START: 30000, // 30 seconds
  /** After this time, consider the transition potentially stuck */
  STUCK_THRESHOLD: 300000, // 5 minutes
  /** Maximum polling interval during extended transitions */
  MAX_BACKOFF: 15000, // 15 seconds
} as const;

/**
 * Calculate the appropriate polling interval based on server status
 * 
 * @param status - Current server status
 * @param isStale - Whether the data is stale
 * @param transitionDuration - How long the server has been in a transition state (ms)
 * @returns Polling interval in ms, or false to disable polling
 */
export function getPollingInterval(
  status: ServerStatus | string,
  isStale: boolean = false,
  transitionDuration: number = 0
): number | false {
  // Transition states - poll frequently, but back off if taking too long
  if (status === ServerStatus.STARTING || status === ServerStatus.STOPPING) {
    if (transitionDuration > TRANSITION_THRESHOLDS.BACKOFF_START) {
      // Exponential backoff: start at 2s, max at 15s
      const backoffFactor = Math.min(
        transitionDuration / TRANSITION_THRESHOLDS.BACKOFF_START,
        TRANSITION_THRESHOLDS.MAX_BACKOFF / POLLING_INTERVALS.TRANSITION
      );
      return Math.min(
        POLLING_INTERVALS.TRANSITION * backoffFactor,
        TRANSITION_THRESHOLDS.MAX_BACKOFF
      );
    }
    return POLLING_INTERVALS.TRANSITION;
  }

  // Failed or unknown - poll to recover
  if (status === ServerStatus.FAILED || status === ServerStatus.UNKNOWN) {
    return POLLING_INTERVALS.RECOVERY;
  }

  // Running - moderate polling for player counts
  if (status === ServerStatus.RUNNING) {
    return isStale ? POLLING_INTERVALS.RUNNING_STALE : POLLING_INTERVALS.RUNNING_NORMAL;
  }

  // Stopped - slow polling or none
  if (status === ServerStatus.STOPPED) {
    return POLLING_INTERVALS.STOPPED;
  }

  return POLLING_INTERVALS.DEFAULT;
}

/**
 * Transition state tracker for monitoring server state changes
 */
export interface TransitionTracker {
  /** Current transition state */
  isTransitioning: boolean;
  /** Status the server is transitioning to */
  targetStatus?: ServerStatus;
  /** Previous status before transition */
  previousStatus?: ServerStatus;
  /** When the transition started */
  transitionStartedAt?: Date;
  /** Duration of current transition in milliseconds */
  transitionDuration: number;
  /** Whether the transition is taking longer than expected */
  isPotentiallyStuck: boolean;
  /** Expected duration for this transition (if known) */
  expectedDuration?: number;
}

/**
 * Hook to track browser tab visibility for pausing polling
 */
export function usePageVisibility(): boolean {
  const [isVisible, setIsVisible] = useState(!document.hidden);

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return isVisible;
}

// Query keys for cache management
export const serverQueryKeys = {
  all: ['servers'] as const,
  lists: () => [...serverQueryKeys.all, 'list'] as const,
  list: () => serverQueryKeys.lists(),
  details: () => [...serverQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...serverQueryKeys.details(), id] as const,
  liveData: () => [...serverQueryKeys.all, 'live'] as const,
  live: (id: string) => [...serverQueryKeys.liveData(), id] as const,
  running: (id: string) => [...serverQueryKeys.all, 'running', id] as const,
};

/**
 * Hook for fetching all servers
 * 
 * Features:
 * - Caches server list
 * - Refetches in background every 30 seconds (configurable)
 * - Deduplicates concurrent requests
 */
export function useServers(
  options?: Omit<UseQueryOptions<ServerSummary[], ApiError>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: serverQueryKeys.list(),
    queryFn: fetchServers,
    staleTime: 10_000, // Consider data fresh for 10 seconds
    refetchInterval: 30_000, // Refetch every 30 seconds
    ...options,
  });
}

/**
 * Hook for fetching server details
 * 
 * @param serverId - The server ID to fetch details for
 */
export function useServerDetails(
  serverId: string | undefined,
  options?: Omit<UseQueryOptions<ServerSummary | null, ApiError>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: serverQueryKeys.detail(serverId || ''),
    queryFn: () => (serverId ? fetchServerDetails(serverId) : null),
    enabled: !!serverId,
    staleTime: 10_000,
    ...options,
  });
}

/**
 * Hook for fetching server live data with polling
 * 
 * Features:
 * - Polls for live status updates
 * - Configurable poll interval
 * - Only polls when enabled (e.g., when component is visible)
 * 
 * @param serverId - The server ID
 * @param serverType - 'native' or 'container'
 * @param pollInterval - Polling interval in ms (default: 5000)
 */
export function useServerLiveData(
  serverId: string | undefined,
  serverType: 'native' | 'container' = 'native',
  pollInterval: number | false = 5000,
  options?: Omit<UseQueryOptions<ServerLiveData, ApiError>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: serverQueryKeys.live(serverId || ''),
    queryFn: () => fetchServerLiveData(serverId!, serverType),
    enabled: !!serverId,
    staleTime: 2_000, // Consider fresh for 2 seconds
    refetchInterval: pollInterval, // Poll interval
    ...options,
  });
}

/**
 * Enhanced hook for fetching server live data with dynamic, status-aware polling
 * 
 * Features:
 * - Dynamic polling intervals based on server status
 * - Transition state tracking with duration monitoring
 * - Exponential backoff for extended transitions
 * - Browser visibility-aware (pauses when tab is hidden)
 * - Stale data detection and faster refresh
 * - Comprehensive transition state information
 * 
 * @param serverId - The server ID
 * @param serverType - 'native' or 'container'
 * @param options - Additional query options
 */
export function useServerLiveDataDynamic(
  serverId: string | undefined,
  serverType: 'native' | 'container' = 'native',
  options?: Omit<UseQueryOptions<ServerLiveData, ApiError>, 'queryKey' | 'queryFn' | 'refetchInterval'>
) {
  const isPageVisible = usePageVisibility();
  const transitionStartRef = useRef<Date | null>(null);
  const previousStatusRef = useRef<ServerStatus | null>(null);
  const [transitionTracker, setTransitionTracker] = useState<TransitionTracker>({
    isTransitioning: false,
    transitionDuration: 0,
    isPotentiallyStuck: false,
  });

  const query = useQuery({
    queryKey: serverQueryKeys.live(serverId || ''),
    queryFn: () => fetchServerLiveData(serverId!, serverType),
    enabled: !!serverId && isPageVisible,
    staleTime: 2_000,
    // Dynamic refetch interval based on status
    refetchInterval: (data) => {
      if (!isPageVisible) return false;
      
      const status = data?.state?.data?.status || ServerStatus.UNKNOWN;
      const isStale = data?.state?.data ? isDataStale(data.state.data) : false;
      const transitionDuration = transitionTracker.transitionDuration;
      
      return getPollingInterval(status, isStale, transitionDuration);
    },
    ...options,
  });

  // Track transitions and update tracker state
  useEffect(() => {
    const currentStatus = query.data?.status;
    if (!currentStatus) return;

    const isInTransition = 
      currentStatus === ServerStatus.STARTING || 
      currentStatus === ServerStatus.STOPPING;

    // Detect transition start
    if (isInTransition && !transitionStartRef.current) {
      transitionStartRef.current = new Date();
      previousStatusRef.current = previousStatusRef.current || ServerStatus.UNKNOWN;
    }
    
    // Detect transition end
    if (!isInTransition && transitionStartRef.current) {
      transitionStartRef.current = null;
    }

    // Update previous status when not in transition
    if (!isInTransition) {
      previousStatusRef.current = currentStatus;
    }

    // Calculate current transition state
    const transitionDuration = transitionStartRef.current 
      ? Date.now() - transitionStartRef.current.getTime() 
      : 0;
    
    const isPotentiallyStuck = transitionDuration > TRANSITION_THRESHOLDS.STUCK_THRESHOLD;

    setTransitionTracker({
      isTransitioning: isInTransition,
      targetStatus: isInTransition ? currentStatus : undefined,
      previousStatus: previousStatusRef.current || undefined,
      transitionStartedAt: transitionStartRef.current || undefined,
      transitionDuration,
      isPotentiallyStuck,
      expectedDuration: query.data?.transition?.expectedDuration,
    });
  }, [query.data?.status, query.data?.transition?.expectedDuration]);

  // Update transition duration periodically while in transition
  useEffect(() => {
    if (!transitionTracker.isTransitioning || !transitionStartRef.current) return;

    const intervalId = setInterval(() => {
      const duration = Date.now() - transitionStartRef.current!.getTime();
      setTransitionTracker(prev => ({
        ...prev,
        transitionDuration: duration,
        isPotentiallyStuck: duration > TRANSITION_THRESHOLDS.STUCK_THRESHOLD,
      }));
    }, 1000);

    return () => clearInterval(intervalId);
  }, [transitionTracker.isTransitioning]);

  return {
    ...query,
    // Additional transition-aware properties
    transitionTracker,
    isTransitioning: transitionTracker.isTransitioning,
    isPotentiallyStuck: transitionTracker.isPotentiallyStuck,
    lastFetchTime: query.dataUpdatedAt ? new Date(query.dataUpdatedAt) : undefined,
    isPageVisible,
  };
}

/**
 * Hook for checking if a server is running
 * 
 * @param serverId - The server ID
 * @param serverType - 'native' or 'container'
 * @param pollInterval - Polling interval in ms (default: 2000)
 */
export function useServerRunning(
  serverId: string | undefined,
  serverType: 'native' | 'container' = 'native',
  pollInterval: number | false = 2000
) {
  return useQuery({
    queryKey: serverQueryKeys.running(serverId || ''),
    queryFn: () => isServerRunning(serverId!, serverType),
    enabled: !!serverId,
    staleTime: 1_000,
    refetchInterval: pollInterval,
  });
}

/**
 * Server action type
 */
export type ServerAction = 'start' | 'stop' | 'restart' | 'safeStop' | 'safeRestart';

/**
 * Mutation input type
 */
interface ServerMutationInput {
  serverId: string;
  serverType?: 'native' | 'container';
}

/**
 * Hook for server mutations (start/stop/restart)
 * 
 * Features:
 * - Automatic query invalidation on success
 * - Optimistic updates (optional)
 * - Error handling
 * 
 * @param action - The action to perform
 */
export function useServerMutation(
  action: ServerAction,
  options?: Omit<
    UseMutationOptions<ServerActionResult, ApiError, ServerMutationInput>,
    'mutationFn'
  >
) {
  const queryClient = useQueryClient();

  const actionFn = (input: ServerMutationInput): Promise<ServerActionResult> => {
    const { serverId, serverType = 'native' } = input;
    
    switch (action) {
      case 'start':
        return startServer(serverId, serverType);
      case 'stop':
        return stopServer(serverId, serverType);
      case 'restart':
        return restartServer(serverId, serverType);
      case 'safeStop':
        return safeStopServer(serverId, serverType);
      case 'safeRestart':
        return safeRestartServer(serverId, serverType);
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  };

  return useMutation({
    mutationFn: actionFn,
    onSuccess: (_data: ServerActionResult, variables: ServerMutationInput) => {
      // Invalidate relevant queries to trigger refetch
      queryClient.invalidateQueries({ queryKey: serverQueryKeys.list() });
      queryClient.invalidateQueries({ queryKey: serverQueryKeys.live(variables.serverId) });
      queryClient.invalidateQueries({ queryKey: serverQueryKeys.running(variables.serverId) });
      queryClient.invalidateQueries({ queryKey: serverQueryKeys.detail(variables.serverId) });
    },
    ...options,
  });
}

/**
 * Convenience hook for start mutation
 */
export function useStartServer(
  options?: Omit<
    UseMutationOptions<ServerActionResult, ApiError, ServerMutationInput>,
    'mutationFn'
  >
) {
  return useServerMutation('start', options);
}

/**
 * Convenience hook for stop mutation
 */
export function useStopServer(
  options?: Omit<
    UseMutationOptions<ServerActionResult, ApiError, ServerMutationInput>,
    'mutationFn'
  >
) {
  return useServerMutation('stop', options);
}

/**
 * Convenience hook for safe stop mutation (with save)
 */
export function useSafeStopServer(
  options?: Omit<
    UseMutationOptions<ServerActionResult, ApiError, ServerMutationInput>,
    'mutationFn'
  >
) {
  return useServerMutation('safeStop', options);
}

/**
 * Convenience hook for restart mutation
 */
export function useRestartServer(
  options?: Omit<
    UseMutationOptions<ServerActionResult, ApiError, ServerMutationInput>,
    'mutationFn'
  >
) {
  return useServerMutation('restart', options);
}

/**
 * Convenience hook for safe restart mutation (with save)
 */
export function useSafeRestartServer(
  options?: Omit<
    UseMutationOptions<ServerActionResult, ApiError, ServerMutationInput>,
    'mutationFn'
  >
) {
  return useServerMutation('safeRestart', options);
}

/**
 * Hook to prefetch server data (useful for hover states)
 */
export function usePrefetchServerData() {
  const queryClient = useQueryClient();

  return {
    prefetchServerDetails: (serverId: string) => {
      queryClient.prefetchQuery({
        queryKey: serverQueryKeys.detail(serverId),
        queryFn: () => fetchServerDetails(serverId),
        staleTime: 10_000,
      });
    },
    prefetchServerLiveData: (serverId: string, serverType: 'native' | 'container' = 'native') => {
      queryClient.prefetchQuery({
        queryKey: serverQueryKeys.live(serverId),
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
    refetchAll: () => queryClient.invalidateQueries({ queryKey: serverQueryKeys.all }),
    refetchList: () => queryClient.invalidateQueries({ queryKey: serverQueryKeys.list() }),
    refetchServer: (serverId: string) => {
      queryClient.invalidateQueries({ queryKey: serverQueryKeys.detail(serverId) });
      queryClient.invalidateQueries({ queryKey: serverQueryKeys.live(serverId) });
      queryClient.invalidateQueries({ queryKey: serverQueryKeys.running(serverId) });
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
