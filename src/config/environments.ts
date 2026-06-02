/**
 * Multi-Environment Configuration
 *
 * Static environment definitions for the ASA dashboard shell. Each environment
 * represents an operational context (typically one host) with zero or more
 * API backend bindings. Environments with zero backends operate in read-only /
 * deep-link-only mode.
 *
 * @see /home/steam/automation/docs/plans/phase5-dashboard-shell-design.md
 */

import type { EnvironmentConfig } from '../types/environment';

// ---------------------------------------------------------------------------
// Runtime Helpers
// ---------------------------------------------------------------------------

/**
 * Resolve the base URL for the ASA control API backend.
 *
 * Priority:
 * 1. VITE_API_BASE_URL environment variable (canonical Phase 5 env var)
 * 2. localStorage "api_endpoint" (user-configurable, set by ApiEndpointSelector)
 * 3. Empty string (same-origin requests, handled by Vite dev proxy)
 */
function resolveAsaBaseUrl(): string {
  return (
    import.meta.env.VITE_API_BASE_URL ||
    localStorage.getItem('api_endpoint') ||
    ''
  );
}

// ---------------------------------------------------------------------------
// Environment Definitions
// ---------------------------------------------------------------------------

/**
 * The static list of all known environments.
 *
 * The `env:asa-remote` environment is the default and maps to the existing
 * single-backend behavior (VITE_API_URL / localStorage). The `env:ilgaming-prod`
 * environment has no control backend yet and operates in deep-link-only mode.
 */
export const environments: EnvironmentConfig[] = [
  {
    environmentId: 'env:asa-remote',
    slug: 'asa-remote',
    name: 'ASA Remote',
    lifecycle: 'prod',
    description: 'Primary ARK: Survival Ascended backend (remote API)',
    backends: [
      {
        backendId: 'asa-control-api',
        type: 'asa-control-api',
        baseUrl: resolveAsaBaseUrl(),
        healthEndpoint: '/health',
        connectionState: 'unknown',
      },
    ],
    isDefault: true,
  },
  {
    environmentId: 'env:ilgaming-prod',
    slug: 'ilgaming',
    name: 'ILGaming Prod',
    lifecycle: 'prod',
    description: 'Local host servers and services (deep-link mode)',
    backends: [],
    links: {
      homepage: 'https://homepage.ilgaming.xyz',
      uptimeKuma: 'https://uptime.ilgaming.xyz',
      dozzle: 'https://logs.ilgaming.xyz',
      docs: 'https://docs.ilgaming.xyz',
      jenkins: 'https://jenkins.ilgaming.xyz',
    },
  },
];

// ---------------------------------------------------------------------------
// Lookup Helpers
// ---------------------------------------------------------------------------

/**
 * Return the default environment — either the one marked `isDefault: true`,
 * or the first entry in the list as a fallback.
 */
export function getDefaultEnvironment(): EnvironmentConfig {
  return environments.find((env) => env.isDefault) ?? environments[0];
}

/**
 * Look up an environment by its canonical environmentId.
 *
 * @param id - The canonical environment ID, e.g. "env:asa-remote"
 * @returns The matching EnvironmentConfig, or undefined if not found
 */
export function getEnvironmentById(
  id: string,
): EnvironmentConfig | undefined {
  return environments.find((env) => env.environmentId === id);
}
