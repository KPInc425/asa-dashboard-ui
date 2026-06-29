import type { TypedAction } from "../types";

export const CONTAINER_ACTIONS: TypedAction[] = [
  { actionId: "start", label: "Start", riskLevel: "low", supportsProgress: false },
  { actionId: "stop", label: "Stop", riskLevel: "medium", confirmMessage: "Are you sure you want to stop this server?", supportsProgress: false },
  { actionId: "restart", label: "Restart", riskLevel: "high", confirmMessage: "Are you sure you want to restart this server?", estimatedDuration: 120, supportsProgress: true },
];
