/**
 * EnvironmentSwitcher
 *
 * A dropdown component that displays all available environments from
 * `useEnvironment()`, shows per-backend connection state indicators,
 * and allows the user to switch between them.
 *
 * Uses the daisyUI dropdown pattern (btn + dropdown-content) and is
 * styled to match the existing sidebar components.
 *
 * @see /home/steam/automation/docs/plans/phase5-dashboard-shell-design.md
 */

import React, { useCallback } from "react";
import { useEnvironment } from "../contexts/EnvironmentContext";
import type { ConnectionState, EnvironmentConfig } from "../types/environment";

// ---------------------------------------------------------------------------
// Connection state colour mapping
// ---------------------------------------------------------------------------

/**
 * Map a ConnectionState to the corresponding daisyUI badge colour class.
 *
 * - connected    → badge-success  (green)
 * - degraded     → badge-warning  (yellow)
 * - disconnected → badge-error    (red)
 * - connecting   → badge-info     (blue)
 * - unknown      → badge-ghost    (gray)
 */
function connectionStateColor(state: ConnectionState): string {
  switch (state) {
    case "connected":
      return "badge-success";
    case "degraded":
      return "badge-warning";
    case "disconnected":
      return "badge-error";
    case "connecting":
      return "badge-info";
    case "unknown":
    default:
      return "badge-ghost";
  }
}

/**
 * Human-readable label for each connection state.
 */
function connectionStateLabel(state: ConnectionState): string {
  switch (state) {
    case "connected":
      return "Connected";
    case "degraded":
      return "Degraded";
    case "disconnected":
      return "Disconnected";
    case "connecting":
      return "Connecting…";
    case "unknown":
    default:
      return "Unknown";
  }
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/**
 * Small coloured dot indicator for a single connection state.
 */
const ConnectionStateDot: React.FC<{ state: ConnectionState }> = ({
  state,
}) => (
  <span
    className={`badge badge-xs ${connectionStateColor(state)}`}
    title={connectionStateLabel(state)}
    aria-label={connectionStateLabel(state)}
  />
);

/**
 * Summarises the overall connection health of an environment by aggregating
 * all backend states into a single dot.
 *
 * - All connected  → green
 * - Any degraded   → yellow (overrides unknown/connected)
 * - Any connecting → blue  (overrides unknown)
 * - Any errors     → red   (overrides everything)
 * - No backends    → gray (unknown)
 * - All unknown     → gray
 */
function aggregateConnectionState(env: EnvironmentConfig): ConnectionState {
  if (env.backends.length === 0) return "unknown";

  let hasConnected = false;
  let hasDegraded = false;
  let hasConnecting = false;
  let hasDisconnected = false;

  for (const backend of env.backends) {
    switch (backend.connectionState) {
      case "connected":
        hasConnected = true;
        break;
      case "degraded":
        hasDegraded = true;
        break;
      case "connecting":
        hasConnecting = true;
        break;
      case "disconnected":
        hasDisconnected = true;
        break;
    }
  }

  // Disconnected is the most severe — always show it.
  if (hasDisconnected) return "disconnected";
  if (hasDegraded) return "degraded";
  if (hasConnecting) return "connecting";
  if (hasConnected) return "connected";

  return "unknown";
}

// ---------------------------------------------------------------------------
// EnvironmentSwitcher
// ---------------------------------------------------------------------------

const EnvironmentSwitcher: React.FC = () => {
  const {
    availableEnvironments,
    currentEnvironment,
    setCurrentEnvironment,
    getBackendConnectionState,
  } = useEnvironment();

  const handleSelect = useCallback(
    (envId: string) => {
      setCurrentEnvironment(envId);
    },
    [setCurrentEnvironment],
  );

  const currentAggregate = aggregateConnectionState(currentEnvironment);

  return (
    <div className="dropdown dropdown-end w-full">
      {/* Trigger button */}
      <button
        className="btn btn-sm btn-outline btn-ghost w-full justify-start gap-2"
        tabIndex={0}
        role="combobox"
        aria-label="Select environment"
        title={`Current environment: ${currentEnvironment.name}`}
      >
        <ConnectionStateDot state={currentAggregate} />

        <div className="flex-1 min-w-0 text-left">
          <div className="truncate text-xs font-medium">
            {currentEnvironment.icon && (
              <span className="mr-1">{currentEnvironment.icon}</span>
            )}
            {currentEnvironment.name}
          </div>
        </div>

        {/* Chevron */}
        <svg
          className="w-3.5 h-3.5 text-base-content/40 flex-shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Dropdown content */}
      <ul
        className="dropdown-content menu p-2 shadow-xl bg-base-100 rounded-box w-72 border border-base-300 z-[60]"
        tabIndex={0}
      >
        {availableEnvironments.map((env) => {
          const isActive =
            env.environmentId === currentEnvironment.environmentId;
          const envAggregate = aggregateConnectionState(env);

          return (
            <li key={env.environmentId}>
              <button
                className={`flex items-start gap-3 p-3 rounded-lg transition-all duration-200 text-left ${
                  isActive
                    ? "bg-primary text-primary-content shadow-md"
                    : "hover:bg-base-200 text-base-content"
                }`}
                onClick={() => handleSelect(env.environmentId)}
                role="option"
                aria-selected={isActive}
              >
                {/* Environment-level status dot */}
                <ConnectionStateDot state={envAggregate} />

                <div className="flex-1 min-w-0">
                  {/* Name row */}
                  <div className="font-medium text-sm flex items-center gap-1">
                    {env.icon && <span>{env.icon}</span>}
                    <span className="truncate">{env.name}</span>
                    {env.isDefault && (
                      <span
                        className={`badge badge-xs ${
                          isActive ? "badge-outline" : "badge-ghost"
                        }`}
                      >
                        default
                      </span>
                    )}
                  </div>

                  {/* Description */}
                  <div
                    className={`text-xs mt-0.5 line-clamp-2 ${
                      isActive
                        ? "text-primary-content/70"
                        : "text-base-content/50"
                    }`}
                  >
                    {env.description}
                  </div>

                  {/* Backend binding states */}
                  {env.backends.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {env.backends.map((backend) => {
                        // Use the live connection state from context if
                        // this is the current environment; otherwise use
                        // the static config value.
                        const state =
                          isActive
                            ? getBackendConnectionState(backend.backendId)
                            : backend.connectionState;

                        return (
                          <span
                            key={backend.backendId}
                            className="inline-flex items-center gap-1 text-xs"
                          >
                            <ConnectionStateDot state={state} />
                            <span
                              className={`truncate max-w-[100px] ${
                                isActive
                                  ? "text-primary-content/60"
                                  : "text-base-content/40"
                              }`}
                            >
                              {backend.backendId}
                            </span>
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default EnvironmentSwitcher;
