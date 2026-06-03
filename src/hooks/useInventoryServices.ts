/**
 * Inventory-Driven Service Hooks
 *
 * React Query hooks that consume `ServiceEntry` from the adapter instead of
 * hardcoded ASA endpoint types. These hooks are the primary data layer for
 * the inventory-driven pages (Servers, ServerDetails, Dashboard).
 *
 * Each hook tries the adapter first, falling back to the existing direct API
 * functions for backward compatibility during the migration.
 *
 * @see /home/steam/automation/docs/plans/phase6-backend-adapter-design.md
 */

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useScopedAdapter, queryKeys } from "./useScopedAdapter";
import { fetchServers, fetchServerDetails } from "../api/serverApi";
import type { ServiceEntry } from "../types/inventory";
import type { ServerSummary } from "../api/serverApi";
import { normalizeStatus } from "../types/serverStatus";

// ---------------------------------------------------------------------------
// Mappers
// ---------------------------------------------------------------------------

/**
 * Map a ServiceEntry (from the adapter) to a ServerSummary (legacy type).
 *
 * This allows the existing page components to work with adapter data without
 * requiring an immediate full rewrite of their rendering logic.
 */
export function serviceEntryToServerSummary(
  entry: ServiceEntry,
): ServerSummary {
  const name = entry.name;
  const status = normalizeStatus(entry.status);

  // Extract type from extensions or infer from runtimeOwner
  let type: ServerSummary["type"] = "native";
  if (entry.extensions?._sourceType === "container") {
    type = "container";
  } else if (entry.kind === "game-server") {
    type = entry.runtimeOwner === "compose" ? "container" : "native";
  }

  return {
    name,
    status,
    type,
    ports: entry.ports,
    map: entry.tags?.find((t) => t.startsWith("map:"))?.replace("map:", ""),
    gamePort: entry.ports?.find((p) => p.protocol === "udp")?.port,
    queryPort: entry.ports?.find((p) => p.port === 27015)?.port,
    rconPort: entry.ports?.find((p) => p.port === 27020)?.port,
    maxPlayers: (entry.extensions?.maxPlayers as number) ?? undefined,
    serverPath: entry.primaryPath,
    clusterName: entry.tags?.find((t) => t.startsWith("cluster:"))?.replace("cluster:", ""),
    isClusterServer: entry.tags?.includes("cluster-server") ?? false,
    players: (entry.extensions?.players as number) ?? undefined,
    autoUpdateStatus: undefined,
  };
}

/**
 * Map ServiceEntry[] to ServerSummary[].
 */
export function serviceEntriesToServerSummaries(
  entries: ServiceEntry[],
): ServerSummary[] {
  return entries.map(serviceEntryToServerSummary);
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

/**
 * Fetch all services from the current adapter, with fallback to direct API.
 *
 * Returns a unified list of ServerSummary items regardless of which data
 * source was used, so the consuming pages don't need to change their
 * rendering logic.
 */
export function useServices() {
  const { adapter } = useScopedAdapter();

  return useQuery<ServerSummary[]>({
    queryKey: adapter
      ? queryKeys.services("current", adapter.backendId)
      : ["servers"],
    queryFn: async () => {
      if (adapter) {
        const entries = await adapter.listServices();
        return serviceEntriesToServerSummaries(entries);
      }
      // Fallback: direct API call for backward compatibility
      return fetchServers();
    },
    staleTime: 5_000,
    refetchInterval: 10_000,
  });
}

/**
 * Fetch a single service by name from the current adapter, with fallback
 * to direct API.
 */
export function useService(serviceName: string) {
  const { adapter } = useScopedAdapter();

  return useQuery<ServerSummary | null>({
    queryKey: adapter
      ? queryKeys.service("current", adapter.backendId, serviceName)
      : ["servers", serviceName],
    queryFn: async () => {
      if (adapter) {
        try {
          const entry = await adapter.getService(serviceName);
          return serviceEntryToServerSummary(entry);
        } catch {
          // If the adapter can't find it by serviceId, try by name via list
          const entries = await adapter.listServices();
          const found = entries.find(
            (e) =>
              e.name === serviceName ||
              e.serviceId.endsWith(`:${serviceName}`),
          );
          if (found) return serviceEntryToServerSummary(found);
          return null;
        }
      }
      // Fallback: direct API call
      try {
        return await fetchServerDetails(serviceName);
      } catch {
        return null;
      }
    },
    enabled: !!serviceName,
    staleTime: 5_000,
    refetchInterval: 10_000,
  });
}

/**
 * Invalidate all service queries to trigger a refetch.
 */
export function useInvalidateServices() {
  const queryClient = useQueryClient();
  const { adapter } = useScopedAdapter();

  return () => {
    const keys = adapter
      ? queryKeys.services("current", adapter.backendId)
      : ["servers"];
    queryClient.invalidateQueries({ queryKey: keys });
  };
}
