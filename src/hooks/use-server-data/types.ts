import { ServerStatus } from "../../types/serverStatus";
import type { BackendAdapter } from "../../adapters/types";

export interface TransitionTracker {
  isTransitioning: boolean;
  targetStatus?: ServerStatus;
  previousStatus?: ServerStatus;
  transitionStartedAt?: Date;
  transitionDuration: number;
  isPotentiallyStuck: boolean;
  expectedDuration?: number;
}

export type ServerAction = "start" | "stop" | "restart" | "safeStop" | "safeRestart";

export interface ServerMutationInput {
  serverId: string;
  serverType?: "native" | "container";
}
