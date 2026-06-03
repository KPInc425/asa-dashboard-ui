/**
 * Environment-Aware Routing Utilities
 *
 * Helpers for constructing and resolving environment-prefixed routes.
 * Routes follow the pattern `/env/:envId/<page>` and are used for
 * direct bookmarking of a specific environment.
 *
 * Legacy flat routes (e.g. `/servers`) redirect to the current
 * environment for backward compatibility.
 *
 * @see /home/steam/automation/docs/plans/phase5-dashboard-shell-design.md
 */

import { useMemo, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useEnvironment } from "../contexts/EnvironmentContext";

// ---------------------------------------------------------------------------
// Route Map
// ---------------------------------------------------------------------------

/**
 * All application route paths, keyed by page name.
 *
 * The `env` variant includes the `:envId` parameter prefix.
 */
export const ROUTES = {
  dashboard: { flat: "/", env: "/env/:envId" },
  servers: { flat: "/servers", env: "/env/:envId/servers" },
  serverDetails: {
    flat: "/servers/:serverName",
    env: "/env/:envId/servers/:serverName",
  },
  rcon: { flat: "/rcon", env: "/env/:envId/rcon" },
  rconConsole: {
    flat: "/rcon/:containerName",
    env: "/env/:envId/rcon/:containerName",
  },
  configs: { flat: "/configs", env: "/env/:envId/configs" },
  globalConfigs: {
    flat: "/global-configs",
    env: "/env/:envId/global-configs",
  },
  systemLogs: { flat: "/system-logs", env: "/env/:envId/system-logs" },
  provisioning: {
    flat: "/provisioning",
    env: "/env/:envId/provisioning",
  },
  discord: { flat: "/discord", env: "/env/:envId/discord" },
  autoUpdate: { flat: "/auto-update", env: "/env/:envId/auto-update" },
  profile: { flat: "/profile", env: "/env/:envId/profile" },
  users: { flat: "/users", env: "/env/:envId/users" },
  login: { flat: "/login", env: "/env/:envId/login" },
  clusterDetails: {
    flat: "/clusters/:clusterName",
    env: "/env/:envId/clusters/:clusterName",
  },
} as const;

/** Map of flat paths to their env-aware equivalents for redirect. */
export const FLAT_TO_ENV: Record<string, string> = {
  "/": "dashboard",
  "/servers": "servers",
  "/rcon": "rcon",
  "/configs": "configs",
  "/global-configs": "globalConfigs",
  "/system-logs": "systemLogs",
  "/provisioning": "provisioning",
  "/discord": "discord",
  "/auto-update": "autoUpdate",
  "/profile": "profile",
  "/users": "users",
  "/login": "login",
};

// ---------------------------------------------------------------------------
// useEnvironmentRouter
// ---------------------------------------------------------------------------

/**
 * Hook that provides environment-aware navigation helpers.
 *
 * Returns functions to build env-aware URLs and navigate to them.
 */
export function useEnvironmentRouter() {
  const { currentEnvironment } = useEnvironment();
  const navigate = useNavigate();
  const params = useParams();
  const envId = params.envId ?? currentEnvironment?.slug ?? "asa-remote";

  /**
   * Build an environment-aware URL path for a named route.
   *
   * @param routeName - The route key from ROUTES
   * @param routeParams - Optional path parameters (e.g. serverName)
   * @returns The full env-prefixed path
   */
  const envUrl = useCallback(
    (
      routeName: keyof typeof ROUTES,
      routeParams?: Record<string, string>,
    ): string => {
      const route = ROUTES[routeName].env;
      let path = route.replace(":envId", envId);
      if (routeParams) {
        for (const [key, value] of Object.entries(routeParams)) {
          path = path.replace(`:${key}`, encodeURIComponent(value));
        }
      }
      return path;
    },
    [envId],
  );

  /**
   * Navigate to an environment-aware route.
   */
  const navigateTo = useCallback(
    (
      routeName: keyof typeof ROUTES,
      routeParams?: Record<string, string>,
    ) => {
      navigate(envUrl(routeName, routeParams));
    },
    [navigate, envUrl],
  );

  /**
   * Resolve a flat path to its env-aware equivalent.
   * Used by the redirect component for legacy URL support.
   */
  const resolveEnvPath = useCallback(
    (flatPath: string): string => {
      const pageKey = FLAT_TO_ENV[flatPath];
      if (pageKey) {
        return envUrl(pageKey as keyof typeof ROUTES);
      }
      return envUrl("dashboard");
    },
    [envUrl],
  );

  return useMemo(
    () => ({ envId, envUrl, navigateTo, resolveEnvPath }),
    [envId, envUrl, navigateTo, resolveEnvPath],
  );
}
