/**
 * Server Data Hooks
 *
 * React Query hooks for server data fetching and caching.
 */
import { useState, useEffect, useRef } from "react";
import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions,
} from "@tanstack/react-query";
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
} from "../../api/serverApi";
import type {
  ServerSummary,
  ServerLiveData,
  ServerActionResult,
} from "../../api/serverApi";
import { ApiError } from "../../api/apiClient";
import { ServerStatus, isDataStale } from "../../types/serverStatus";
import type { BackendAdapter } from "../../adapters/types";
import { getPollingInterval, POLLING_INTERVALS, TRANSITION_THRESHOLDS } from "./polling";
import { serverQueryKeys } from "./query-keys";
import type { TransitionTracker, ServerAction, ServerMutationInput } from "./types";

export function usePageVisibility(): boolean {
  const [isVisible, setIsVisible] = useState(!document.hidden);
  useEffect(() => {
    const handleVisibilityChange = () => setIsVisible(!document.hidden);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);
  return isVisible;
}

export function useServers(
  options?: Omit<UseQueryOptions<ServerSummary[], ApiError>, "queryKey" | "queryFn">,
) {
  return useQuery({
    queryKey: serverQueryKeys.list(),
    queryFn: fetchServers,
    staleTime: 10_000,
    refetchInterval: 30_000,
    ...options,
  });
}

export function useServerDetails(
  serverId: string | undefined,
  options?: Omit<UseQueryOptions<ServerSummary | null, ApiError>, "queryKey" | "queryFn">,
) {
  return useQuery({
    queryKey: serverQueryKeys.detail(serverId || ""),
    queryFn: () => (serverId ? fetchServerDetails(serverId) : null),
    enabled: !!serverId,
    staleTime: 10_000,
    ...options,
  });
}

export function useServerLiveData(
  serverId: string | undefined,
  serverType: "native" | "container" = "native",
  pollInterval: number | false = 5000,
  options?: Omit<UseQueryOptions<ServerLiveData, ApiError>, "queryKey" | "queryFn">,
) {
  return useQuery({
    queryKey: serverQueryKeys.live(serverId || ""),
    queryFn: () => fetchServerLiveData(serverId!, serverType),
    enabled: !!serverId,
    staleTime: 2_000,
    refetchInterval: pollInterval,
    ...options,
  });
}

export function useServerLiveDataDynamic(
  serverId: string | undefined,
  serverType: "native" | "container" = "native",
  options?: Omit<UseQueryOptions<ServerLiveData, ApiError>, "queryKey" | "queryFn" | "refetchInterval">,
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
    queryKey: serverQueryKeys.live(serverId || ""),
    queryFn: () => fetchServerLiveData(serverId!, serverType),
    enabled: !!serverId && isPageVisible,
    staleTime: 2_000,
    refetchInterval: (data) => {
      if (!isPageVisible) return false;
      const status = data?.state?.data?.status || ServerStatus.UNKNOWN;
      const isStale = data?.state?.data ? isDataStale(data.state.data) : false;
      return getPollingInterval(status, isStale, transitionTracker.transitionDuration);
    },
    ...options,
  });

  useEffect(() => {
    const currentStatus = query.data?.status;
    if (!currentStatus) return;
    const isInTransition = currentStatus === ServerStatus.STARTING || currentStatus === ServerStatus.STOPPING;

    if (isInTransition && !transitionStartRef.current) {
      transitionStartRef.current = new Date();
      previousStatusRef.current = previousStatusRef.current || ServerStatus.UNKNOWN;
    }
    if (!isInTransition && transitionStartRef.current) {
      transitionStartRef.current = null;
    }
    if (!isInTransition) {
      previousStatusRef.current = currentStatus;
    }

    const transitionDuration = transitionStartRef.current ? Date.now() - transitionStartRef.current.getTime() : 0;
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

  useEffect(() => {
    if (!transitionTracker.isTransitioning || !transitionStartRef.current) return;
    const intervalId = setInterval(() => {
      const duration = Date.now() - transitionStartRef.current!.getTime();
      setTransitionTracker((prev) => ({
        ...prev,
        transitionDuration: duration,
        isPotentiallyStuck: duration > TRANSITION_THRESHOLDS.STUCK_THRESHOLD,
      }));
    }, 1000);
    return () => clearInterval(intervalId);
  }, [transitionTracker.isTransitioning]);

  return {
    ...query,
    transitionTracker,
    isTransitioning: transitionTracker.isTransitioning,
    isPotentiallyStuck: transitionTracker.isPotentiallyStuck,
    lastFetchTime: query.dataUpdatedAt ? new Date(query.dataUpdatedAt) : undefined,
    isPageVisible,
  };
}

export function useServerRunning(
  serverId: string | undefined,
  serverType: "native" | "container" = "native",
  pollInterval: number | false = 2000,
) {
  return useQuery({
    queryKey: serverQueryKeys.running(serverId || ""),
    queryFn: () => isServerRunning(serverId!, serverType),
    enabled: !!serverId,
    staleTime: 1_000,
    refetchInterval: pollInterval,
  });
}

export function useServerMutation(
  action: ServerAction,
  options?: Omit<UseMutationOptions<ServerActionResult, ApiError, ServerMutationInput>, "mutationFn">,
  adapter?: BackendAdapter,
) {
  const queryClient = useQueryClient();

  const actionFn = async (input: ServerMutationInput): Promise<ServerActionResult> => {
    const { serverId, serverType = "native" } = input;
    if (adapter) {
      const actionIdMap: Record<string, string> = { start: "start", stop: "stop", restart: "restart", safeStop: "stop", safeRestart: "restart" };
      const mappedId = actionIdMap[action];
      if (mappedId) {
        const availableActions = await adapter.getAvailableActions(serverId);
        const typedAction = availableActions.find((a) => a.actionId === mappedId);
        if (typedAction) {
          const result = await adapter.executeAction(serverId, typedAction);
          return { success: result.success, message: result.message, jobId: result.jobId };
        }
      }
    }
    switch (action) {
      case "start": return startServer(serverId, serverType);
      case "stop": return stopServer(serverId, serverType);
      case "restart": return restartServer(serverId, serverType);
      case "safeStop": return safeStopServer(serverId, serverType);
      case "safeRestart": return safeRestartServer(serverId, serverType);
      default: throw new Error(`Unknown action: ${action}`);
    }
  };

  return useMutation({
    mutationFn: actionFn,
    onSuccess: (_data: ServerActionResult, variables: ServerMutationInput) => {
      queryClient.invalidateQueries({ queryKey: serverQueryKeys.list() });
      queryClient.invalidateQueries({ queryKey: serverQueryKeys.live(variables.serverId) });
      queryClient.invalidateQueries({ queryKey: serverQueryKeys.running(variables.serverId) });
      queryClient.invalidateQueries({ queryKey: serverQueryKeys.detail(variables.serverId) });
    },
    ...options,
  });
}

export function useStartServer(options?: Omit<UseMutationOptions<ServerActionResult, ApiError, ServerMutationInput>, "mutationFn">) {
  return useServerMutation("start", options);
}

export function useStopServer(options?: Omit<UseMutationOptions<ServerActionResult, ApiError, ServerMutationInput>, "mutationFn">) {
  return useServerMutation("stop", options);
}

export function useSafeStopServer(options?: Omit<UseMutationOptions<ServerActionResult, ApiError, ServerMutationInput>, "mutationFn">) {
  return useServerMutation("safeStop", options);
}

export function useRestartServer(options?: Omit<UseMutationOptions<ServerActionResult, ApiError, ServerMutationInput>, "mutationFn">) {
  return useServerMutation("restart", options);
}

export function useSafeRestartServer(options?: Omit<UseMutationOptions<ServerActionResult, ApiError, ServerMutationInput>, "mutationFn">) {
  return useServerMutation("safeRestart", options);
}

export function usePrefetchServerData() {
  const queryClient = useQueryClient();
  return {
    prefetchServerDetails: (serverId: string) => {
      queryClient.prefetchQuery({ queryKey: serverQueryKeys.detail(serverId), queryFn: () => fetchServerDetails(serverId), staleTime: 10_000 });
    },
    prefetchServerLiveData: (serverId: string, serverType: "native" | "container" = "native") => {
      queryClient.prefetchQuery({ queryKey: serverQueryKeys.live(serverId), queryFn: () => fetchServerLiveData(serverId, serverType), staleTime: 10_000 });
    },
  };
}
