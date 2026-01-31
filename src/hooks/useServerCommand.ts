/**
 * Server Command Hooks
 * 
 * Enhanced mutation hooks for server commands with:
 * - Optimistic updates (immediate UI feedback)
 * - Automatic refetching on command completion
 * - Transition state management
 * - Retry logic for transient failures
 * - Progress tracking
 * 
 * Usage:
 * ```tsx
 * import { useServerCommand } from '../hooks/useServerCommand';
 * 
 * function ServerControls({ serverId }: { serverId: string }) {
 *   const { startMutation, stopMutation, restartMutation, isPending } = useServerCommand();
 *   
 *   return (
 *     <div>
 *       <button 
 *         onClick={() => startMutation.mutate({ serverId })}
 *         disabled={isPending}
 *       >
 *         Start
 *       </button>
 *     </div>
 *   );
 * }
 * ```
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  startServer,
  stopServer,
  restartServer,
  safeStopServer,
  safeRestartServer,
} from '../api/serverApi';
import type { ServerActionResult, ServerLiveData } from '../api/serverApi';
import { ApiError } from '../api/apiClient';
import { ServerStatus, type TransitionState } from '../types/serverStatus';
import { serverQueryKeys } from './useServerData';

/**
 * Mutation input type for server commands
 */
export interface ServerCommandInput {
  serverId: string;
  serverType?: 'native' | 'container';
}

/**
 * Options for the useServerCommand hook
 */
export interface UseServerCommandOptions {
  /** Callback when mutation starts */
  onMutationStart?: (action: string, serverId: string) => void;
  /** Callback on successful mutation */
  onSuccess?: (action: string, serverId: string, result: ServerActionResult) => void;
  /** Callback on mutation error */
  onError?: (action: string, serverId: string, error: ApiError) => void;
  /** Callback when mutation settles (success or error) */
  onSettled?: (action: string, serverId: string) => void;
  /** Whether to use optimistic updates (default: true) */
  enableOptimisticUpdates?: boolean;
  /** Number of retries on transient failures (default: 2) */
  retryCount?: number;
}

/**
 * Get the expected transition state for an action
 */
function getTransitionStateForAction(
  action: 'start' | 'stop' | 'restart' | 'safeStop' | 'safeRestart',
  _previousStatus?: ServerStatus
): { status: ServerStatus; expectedDuration?: number } {
  switch (action) {
    case 'start':
      return { status: ServerStatus.STARTING, expectedDuration: 60000 }; // 1 minute typical
    case 'stop':
    case 'safeStop':
      return { status: ServerStatus.STOPPING, expectedDuration: 30000 }; // 30 seconds typical
    case 'restart':
    case 'safeRestart':
      return { status: ServerStatus.STOPPING, expectedDuration: 90000 }; // 1.5 minute for full restart
    default:
      return { status: ServerStatus.UNKNOWN };
  }
}

/**
 * Context type for mutation rollback
 */
interface MutationContext {
  previousData?: ServerLiveData;
  queryKey?: readonly string[];
}

/**
 * Enhanced hook for server commands with optimistic updates and transition tracking
 * 
 * Provides mutations for start, stop, restart, safeStop, and safeRestart operations
 * with automatic optimistic updates and proper cache invalidation.
 */
export function useServerCommand(options: UseServerCommandOptions = {}) {
  const queryClient = useQueryClient();
  const {
    onMutationStart,
    onSuccess,
    onError,
    onSettled,
    enableOptimisticUpdates = true,
    retryCount = 2,
  } = options;

  /**
   * Create optimistic update for a server command
   */
  const createOptimisticUpdate = async (
    action: 'start' | 'stop' | 'restart' | 'safeStop' | 'safeRestart',
    input: ServerCommandInput
  ): Promise<MutationContext> => {
    if (!enableOptimisticUpdates) {
      return {};
    }

    const { serverId } = input;
    const queryKey = serverQueryKeys.live(serverId);

    // Cancel any outgoing refetches to prevent overwriting optimistic update
    await queryClient.cancelQueries({ queryKey });

    // Snapshot the previous value
    const previousData = queryClient.getQueryData<ServerLiveData>(queryKey);

    // Get the expected transition state
    const transitionInfo = getTransitionStateForAction(
      action,
      previousData?.status
    );

    // Optimistically update to the transition state
    queryClient.setQueryData<ServerLiveData>(queryKey, (old) => {
      if (!old) return old;

      const transition: TransitionState = {
        status: transitionInfo.status,
        previousStatus: old.status,
        transitionStartedAt: new Date().toISOString(),
        expectedDuration: transitionInfo.expectedDuration,
      };

      return {
        ...old,
        status: transitionInfo.status,
        transition,
        updatedAt: new Date().toISOString(),
      };
    });

    return { previousData, queryKey: queryKey as readonly string[] };
  };

  /**
   * Handle mutation error - rollback optimistic update
   */
  const handleMutationError = (
    action: string,
    error: ApiError,
    input: ServerCommandInput,
    context: MutationContext | undefined
  ) => {
    // Rollback to previous data on error
    if (context?.previousData && context?.queryKey) {
      queryClient.setQueryData(context.queryKey, context.previousData);
    }

    onError?.(action, input.serverId, error);
  };

  /**
   * Handle mutation settlement - always refetch to ensure data consistency
   */
  const handleMutationSettled = (action: string, serverId: string) => {
    // Always invalidate queries after mutation settles
    queryClient.invalidateQueries({ queryKey: serverQueryKeys.live(serverId) });
    queryClient.invalidateQueries({ queryKey: serverQueryKeys.running(serverId) });
    queryClient.invalidateQueries({ queryKey: serverQueryKeys.detail(serverId) });
    queryClient.invalidateQueries({ queryKey: serverQueryKeys.list() });

    onSettled?.(action, serverId);
  };

  // Start server mutation
  const startMutation = useMutation<
    ServerActionResult,
    ApiError,
    ServerCommandInput,
    MutationContext
  >({
    mutationFn: ({ serverId, serverType = 'native' }) => startServer(serverId, serverType),
    onMutate: async (input) => {
      onMutationStart?.('start', input.serverId);
      return createOptimisticUpdate('start', input);
    },
    onSuccess: (result, input) => {
      onSuccess?.('start', input.serverId, result);
    },
    onError: (error, input, context) => {
      handleMutationError('start', error, input, context);
    },
    onSettled: (_, __, input) => {
      handleMutationSettled('start', input.serverId);
    },
    retry: retryCount,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });

  // Stop server mutation
  const stopMutation = useMutation<
    ServerActionResult,
    ApiError,
    ServerCommandInput,
    MutationContext
  >({
    mutationFn: ({ serverId, serverType = 'native' }) => stopServer(serverId, serverType),
    onMutate: async (input) => {
      onMutationStart?.('stop', input.serverId);
      return createOptimisticUpdate('stop', input);
    },
    onSuccess: (result, input) => {
      onSuccess?.('stop', input.serverId, result);
    },
    onError: (error, input, context) => {
      handleMutationError('stop', error, input, context);
    },
    onSettled: (_, __, input) => {
      handleMutationSettled('stop', input.serverId);
    },
    retry: retryCount,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });

  // Restart server mutation
  const restartMutation = useMutation<
    ServerActionResult,
    ApiError,
    ServerCommandInput,
    MutationContext
  >({
    mutationFn: ({ serverId, serverType = 'native' }) => restartServer(serverId, serverType),
    onMutate: async (input) => {
      onMutationStart?.('restart', input.serverId);
      return createOptimisticUpdate('restart', input);
    },
    onSuccess: (result, input) => {
      onSuccess?.('restart', input.serverId, result);
    },
    onError: (error, input, context) => {
      handleMutationError('restart', error, input, context);
    },
    onSettled: (_, __, input) => {
      handleMutationSettled('restart', input.serverId);
    },
    retry: retryCount,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });

  // Safe stop (with save) mutation
  const safeStopMutation = useMutation<
    ServerActionResult,
    ApiError,
    ServerCommandInput,
    MutationContext
  >({
    mutationFn: ({ serverId, serverType = 'native' }) => safeStopServer(serverId, serverType),
    onMutate: async (input) => {
      onMutationStart?.('safeStop', input.serverId);
      return createOptimisticUpdate('safeStop', input);
    },
    onSuccess: (result, input) => {
      onSuccess?.('safeStop', input.serverId, result);
    },
    onError: (error, input, context) => {
      handleMutationError('safeStop', error, input, context);
    },
    onSettled: (_, __, input) => {
      handleMutationSettled('safeStop', input.serverId);
    },
    retry: retryCount,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });

  // Safe restart (with save) mutation
  const safeRestartMutation = useMutation<
    ServerActionResult,
    ApiError,
    ServerCommandInput,
    MutationContext
  >({
    mutationFn: ({ serverId, serverType = 'native' }) => safeRestartServer(serverId, serverType),
    onMutate: async (input) => {
      onMutationStart?.('safeRestart', input.serverId);
      return createOptimisticUpdate('safeRestart', input);
    },
    onSuccess: (result, input) => {
      onSuccess?.('safeRestart', input.serverId, result);
    },
    onError: (error, input, context) => {
      handleMutationError('safeRestart', error, input, context);
    },
    onSettled: (_, __, input) => {
      handleMutationSettled('safeRestart', input.serverId);
    },
    retry: retryCount,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });

  // Combined pending state
  const isPending =
    startMutation.isPending ||
    stopMutation.isPending ||
    restartMutation.isPending ||
    safeStopMutation.isPending ||
    safeRestartMutation.isPending;

  // Get the current action being performed
  const currentAction = startMutation.isPending
    ? 'start'
    : stopMutation.isPending
    ? 'stop'
    : restartMutation.isPending
    ? 'restart'
    : safeStopMutation.isPending
    ? 'safeStop'
    : safeRestartMutation.isPending
    ? 'safeRestart'
    : null;

  return {
    startMutation,
    stopMutation,
    restartMutation,
    safeStopMutation,
    safeRestartMutation,
    isPending,
    currentAction,
    // Convenience methods
    start: startMutation.mutate,
    stop: stopMutation.mutate,
    restart: restartMutation.mutate,
    safeStop: safeStopMutation.mutate,
    safeRestart: safeRestartMutation.mutate,
    // Async versions
    startAsync: startMutation.mutateAsync,
    stopAsync: stopMutation.mutateAsync,
    restartAsync: restartMutation.mutateAsync,
    safeStopAsync: safeStopMutation.mutateAsync,
    safeRestartAsync: safeRestartMutation.mutateAsync,
  };
}

export default useServerCommand;
