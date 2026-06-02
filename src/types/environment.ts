/**
 * Multi-Environment Shell Types
 *
 * Type definitions for the multi-environment shell, following the Phase 5
 * design doc. These types represent the canonical environment entity and
 * its backend bindings, enabling the dashboard to manage connections to
 * multiple backend environments with different capabilities.
 *
 * @see /home/steam/automation/docs/plans/phase5-dashboard-shell-design.md
 * @see /home/steam/automation/docs/plans/phase1-canonical-model.md
 */

// ---------------------------------------------------------------------------
// Lifecycle
// ---------------------------------------------------------------------------

/**
 * The operational lifecycle stage of an environment.
 *
 * - `prod`: Production — live user-facing services
 * - `staging`: Pre-production validation environment
 * - `lab`: Experimental or test environment
 * - `local`: Local development environment
 * - `dev`: Shared development environment
 */
export type EnvironmentLifecycle = "prod" | "staging" | "lab" | "local" | "dev";

// ---------------------------------------------------------------------------
// Backend type
// ---------------------------------------------------------------------------

/**
 * The type of backend API adapter the dashboard uses to communicate with
 * a backend.
 *
 * - `asa-control-api`: The existing ASA Server Management API (Node.js/Fastify)
 * - `deployctl`: Backend managed via deployctl.sh and apps/*.conf
 * - `generic`: A generic REST adapter with manually configured capabilities
 * - `unknown`: Unrecognized or unclassified backend type
 */
export type BackendType =
    | "asa-control-api"
    | "deployctl"
    | "generic"
    | "unknown";

// ---------------------------------------------------------------------------
// Connection state
// ---------------------------------------------------------------------------

/**
 * The current connection state to a backend environment.
 *
 * - `connected`: Backend is reachable and all health checks pass
 * - `degraded`: Backend is reachable but some operations may fail or data is stale
 * - `disconnected`: Backend is unreachable or returned errors
 * - `connecting`: Connection check is in progress
 * - `unknown`: No connection check has been performed yet
 */
export type ConnectionState =
    | "connected"
    | "degraded"
    | "disconnected"
    | "connecting"
    | "unknown";

// ---------------------------------------------------------------------------
// Backend auth profile
// ---------------------------------------------------------------------------

/**
 * The type of authentication used by a backend binding.
 *
 * - `jwt`: JSON Web Token — typically obtained via login flow
 * - `bearer`: Static bearer token
 * - `api-key`: Static API key (header or query parameter)
 * - `none`: No authentication required
 * - `oidc`: OpenID Connect — delegated identity provider flow
 */
export type BackendAuthProfileType =
    | "jwt"
    | "bearer"
    | "api-key"
    | "none"
    | "oidc";

/**
 * Describes the authentication profile for a backend binding.
 *
 * The profile identifies which auth mechanism to use. Actual credentials
 * or tokens are held at runtime (e.g. in AuthContext) and are never
 * serialized into the environment config.
 */
export interface BackendAuthProfile {
    /** Unique identifier for this auth profile */
    profileId: string;
    /** The authentication mechanism type */
    type: BackendAuthProfileType;
}

// ---------------------------------------------------------------------------
// Backend binding
// ---------------------------------------------------------------------------

/**
 * Describes how the dashboard connects to a specific backend API.
 *
 * BackendBinding is an inline structure that always belongs to an
 * EnvironmentConfig. An environment may have zero or more bindings.
 * With zero bindings, the environment operates in "deep-link-only" mode.
 */
export interface BackendBinding {
    /** Unique identifier for this backend within the environment */
    backendId: string;
    /** Backend adapter type */
    type: BackendType;
    /** API base URL for the backend */
    baseUrl: string;
    /** Backend API version, if discoverable */
    apiVersion?: string;
    /** Auth profile to use when connecting to this backend */
    authProfileId?: string;
    /** Optional health check endpoint path (e.g. "/health") */
    healthEndpoint?: string;
    /** Resolved capabilities from discovery or manifest */
    capabilities?: string[];
    /** Current connection state */
    connectionState: ConnectionState;
    /** Timestamp (epoch ms) of the last connection check */
    lastCheckedAt?: number;
}

// ---------------------------------------------------------------------------
// Environment configuration
// ---------------------------------------------------------------------------

/**
 * A map of human-readable link labels to URLs.
 */
export interface EnvironmentLinks {
    homepage?: string;
    uptimeKuma?: string;
    dozzle?: string;
    docs?: string;
    jenkins?: string;
}

/**
 * An environment represents a distinct operational context — typically one
 * host — where services run. Environments are configured statically via a
 * TypeScript config file.
 *
 * An environment may have zero or more backend bindings. With no bindings,
 * the dashboard operates in read-only / deep-link mode.
 */
export interface EnvironmentConfig {
    /** Canonical environment ID, e.g. "ilgaming-prod" */
    environmentId: string;
    /** URL-friendly slug, e.g. "prod" */
    slug: string;
    /** Human-readable name, e.g. "ILGaming Production" */
    name: string;
    /** Operational lifecycle stage */
    lifecycle: EnvironmentLifecycle;
    /** Free-text description */
    description: string;
    /** Optional emoji or icon identifier for UI display */
    icon?: string;
    /** Zero or more API backend bindings for this environment */
    backends: BackendBinding[];
    /** External service links for read-only / deep-link mode */
    links?: EnvironmentLinks;
    /** Marks the default environment on first load */
    isDefault?: boolean;
}
