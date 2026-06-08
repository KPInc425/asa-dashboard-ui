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

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useEnvironment } from "../contexts/EnvironmentContext";
import type { ConnectionState, EnvironmentConfig } from "../types/environment";
import { getEnvironmentById } from "../config/environments";

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
  const location = useLocation();
  const navigate = useNavigate();

  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});

  /**
   * Position the dropdown menu using fixed positioning so it never gets
   * clipped by the sidebar or viewport boundaries. We prefer opening
   * upward (above the trigger) but fall back to downward when space is
   * tight. A ResizeObserver keeps the position correct when the menu
   * content changes size.
   */
  const repositionMenu = useCallback(() => {
    if (!buttonRef.current || !menuRef.current) return;

    const rect = buttonRef.current.getBoundingClientRect();
    const menuHeight = menuRef.current.scrollHeight;
    const gap = 4; // tighter gap so the menu hugs the trigger
    const spaceAbove = rect.top - gap;
    const spaceBelow = window.innerHeight - rect.bottom - gap;

    let top: number | undefined;
    let bottom: number | undefined;
    let maxHeight: number;

    if (spaceAbove >= menuHeight || spaceAbove >= spaceBelow) {
      // Open above the trigger
      bottom = window.innerHeight - rect.top + gap;
      maxHeight = spaceAbove;
    } else {
      // Open below the trigger
      top = rect.bottom + gap;
      maxHeight = spaceBelow;
    }

    setMenuStyle({
      position: "fixed",
      top: top ?? undefined,
      bottom: bottom ?? undefined,
      left: rect.left,
      width: rect.width,
      maxHeight: Math.min(maxHeight, 480),
      overflowY: "auto",
    });
  }, []);

  useEffect(() => {
    repositionMenu();
    window.addEventListener("resize", repositionMenu);
    return () => window.removeEventListener("resize", repositionMenu);
  }, [repositionMenu]);

  useEffect(() => {
    if (!menuRef.current) return;
    const observer = new ResizeObserver(() => repositionMenu());
    observer.observe(menuRef.current);
    return () => observer.disconnect();
  }, [repositionMenu]);

  // Detect if we're in env-aware routing mode
  const isEnvAware = useMemo(() => {
    return location.pathname.startsWith("/env/");
  }, [location.pathname]);

  // Extract the current relative path within the env prefix
  const currentRelativePath = useMemo(() => {
    if (isEnvAware) {
      // /env/asa-remote/servers -> /servers
      const match = location.pathname.match(/^\/env\/[^/]+(\/.*)?$/);
      return match?.[1] || "/";
    }
    // Keep the current path for non-env-aware navigation
    return location.pathname;
  }, [location.pathname, isEnvAware]);

  const handleSelect = useCallback(
    (envId: string) => {
      if (envId === currentEnvironment.environmentId) return;
      setCurrentEnvironment(envId);

      if (isEnvAware) {
        // Navigate to the same relative path in the new environment
        const env = getEnvironmentById(envId);
        const slug = env?.slug ?? envId.replace("env:", "");
        navigate(
          `/env/${slug}${currentRelativePath === "/" ? "" : currentRelativePath}`,
        );
      }
    },
    [
      currentEnvironment.environmentId,
      setCurrentEnvironment,
      isEnvAware,
      navigate,
      currentRelativePath,
    ],
  );

  const currentAggregate = aggregateConnectionState(currentEnvironment);

  return (
    <div className="dropdown w-full">
      {/* Trigger button */}
      <button
        ref={buttonRef}
        onClick={() => {
          // Double rAF ensures the menu has been laid out and is visible
          // before we measure its bounding box.
          requestAnimationFrame(() => {
            requestAnimationFrame(repositionMenu);
          });
        }}
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

      {/* Dropdown content — match sidebar width so it doesn't overflow */}
      <ul
        ref={menuRef}
        style={menuStyle}
        className="dropdown-content menu p-2 shadow-xl bg-base-100 rounded-box border border-base-300 z-[60] min-w-0 transition-all duration-200 ease-out origin-bottom"
        tabIndex={0}
      >
        {availableEnvironments.map((env) => {
          const isActive =
            env.environmentId === currentEnvironment.environmentId;
          const envAggregate = aggregateConnectionState(env);

          return (
            <li key={env.environmentId}>
              <button
                className={`flex items-start gap-3 p-3 rounded-lg transition-all duration-200 ease-out text-left group ${
                  isActive
                    ? "bg-primary text-primary-content shadow-md ring-1 ring-primary/20"
                    : "hover:bg-base-200 hover:translate-x-1 hover:shadow-sm text-base-content border-l-2 border-transparent hover:border-primary/40"
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
                    {env.icon && (
                      <span className="transition-transform duration-200 group-hover:scale-110">
                        {env.icon}
                      </span>
                    )}
                    <span className="truncate">{env.name}</span>
                    {env.isDefault && (
                      <span
                        className={`badge badge-xs ml-1 ${
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
                        const state = isActive
                          ? getBackendConnectionState(backend.backendId)
                          : backend.connectionState;

                        return (
                          <span
                            key={backend.backendId}
                            className="inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-md bg-base-300/40 hover:bg-base-300/70 transition-colors"
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
