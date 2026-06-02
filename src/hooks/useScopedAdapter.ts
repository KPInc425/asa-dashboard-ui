/**
 * Scoped Adapter Hook
 *
 * React hook that resolves the current environment's primary backend
 * adapter from the adapter registry. All queries are scoped by
 * environment + backend + resource to prevent cross-environment
 * cache pollution.
 *
 * @see /home/steam/automation/docs/plans/phase6-backend-adapter-design.md
 */

import { useMemo } from "react";
import { useEnvironment } from "../contexts/EnvironmentContext";
import { adapterRegistry } from "../adapters/adapter-registry";
import type { LogOptions } from "../adapters/types";

// ---------------------------------------------------------------------------
// Query key factory
// ---------------------------------------------------------------------------

/**
 * React Query key factory scoped by environment + backend.
 *
 * Using these keys ensures that queries for different environments or
 * backends do not collide in the cache.
 */
export const queryKeys = {
    /** All services for an environment + backend pair */
    services: (envId: string, backendId: string) =>
        ["services", envId, backendId] as const,

    /** A single service by ID */
    service: (envId: string, backendId: string, serviceId: string) =>
        ["services", envId, backendId, serviceId] as const,

    /** Service status data */
    serviceStatus: (envId: string, backendId: string, serviceId: string) =>
        ["services", envId, backendId, serviceId, "status"] as const,

    /** Service log entries */
    serviceLogs: (
        envId: string,
        backendId: string,
        serviceId: string,
        options?: LogOptions,
    ) => ["services", envId, backendId, serviceId, "logs", options] as const,
};

// ---------------------------------------------------------------------------
// useScopedAdapter
// ---------------------------------------------------------------------------

/**
 * Hook that returns the adapter for the current environment's primary
 * backend, along with the environment and backend IDs for query key
 * scoping.
 *
 * Usage:
 * ```typescript
 * const { adapter, envId, backendId } = useScopedAdapter();
 *
 * return useQuery({
 *   queryKey: queryKeys.services(envId, backendId),
 *   queryFn: () => adapter?.listServices() ?? Promise.resolve([]),
 *   enabled: !!adapter,
 * });
 * ```
 */
export function useScopedAdapter(): {
    adapter: ReturnType<typeof adapterRegistry.getCurrentAdapter>;
    envId: string;
    backendId: string;
} {
    const { currentEnvironment } = useEnvironment();
    const primaryBackend = currentEnvironment?.backends[0];
    const backendId = primaryBackend?.backendId ?? "none";

    // EnvironmentContext handles register/unregister on environment switch.
    // Read-only lookup via useMemo keeps this pure during render.
    const adapter = useMemo(() => adapterRegistry.get(backendId), [backendId]);
    const envId = currentEnvironment?.environmentId ?? "unknown";

    return { adapter, envId, backendId };
}
