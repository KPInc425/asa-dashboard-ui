import { ServerStatus } from "../../types/serverStatus";

export const POLLING_INTERVALS = {
  TRANSITION: 2000,
  RECOVERY: 10000,
  RUNNING_STALE: 5000,
  RUNNING_NORMAL: 30000,
  STOPPED: 60000,
  DEFAULT: 30000,
} as const;

export const TRANSITION_THRESHOLDS = {
  BACKOFF_START: 30000,
  STUCK_THRESHOLD: 300000,
  MAX_BACKOFF: 15000,
} as const;

export function getPollingInterval(
  status: ServerStatus | string,
  isStale: boolean = false,
  transitionDuration: number = 0,
): number | false {
  if (status === ServerStatus.STARTING || status === ServerStatus.STOPPING) {
    if (transitionDuration > TRANSITION_THRESHOLDS.BACKOFF_START) {
      const backoffFactor = Math.min(
        transitionDuration / TRANSITION_THRESHOLDS.BACKOFF_START,
        TRANSITION_THRESHOLDS.MAX_BACKOFF / POLLING_INTERVALS.TRANSITION,
      );
      return Math.min(
        POLLING_INTERVALS.TRANSITION * backoffFactor,
        TRANSITION_THRESHOLDS.MAX_BACKOFF,
      );
    }
    return POLLING_INTERVALS.TRANSITION;
  }
  if (status === ServerStatus.FAILED || status === ServerStatus.UNKNOWN) {
    return POLLING_INTERVALS.RECOVERY;
  }
  if (status === ServerStatus.RUNNING) {
    return isStale ? POLLING_INTERVALS.RUNNING_STALE : POLLING_INTERVALS.RUNNING_NORMAL;
  }
  if (status === ServerStatus.STOPPED) {
    return POLLING_INTERVALS.STOPPED;
  }
  return POLLING_INTERVALS.DEFAULT;
}
