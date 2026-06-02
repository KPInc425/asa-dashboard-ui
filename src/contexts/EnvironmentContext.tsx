/**
 * Environment Context
 *
 * React context providing the current environment, available environments,
 * backend connection states, and capability resolution for the ASA dashboard.
 * This is the central state management for the multi-environment shell.
 *
 * @see /home/steam/automation/docs/plans/phase5-dashboard-shell-design.md
 */

import React, {
    createContext,
    useContext,
    useState,
    useCallback,
    useMemo,
} from "react";
import type { ReactNode } from "react";
import type {
    EnvironmentConfig,
    BackendBinding,
    ConnectionState,
} from "../types/environment";
import type {
    CapabilityFlag,
    CapabilityManifest,
    EnvironmentCapabilities,
} from "../types/capabilities";
import {
    environments as staticEnvironments,
    getDefaultEnvironment,
    getEnvironmentById,
} from "../config/environments";
import { setEnvironmentBaseUrl } from "../services/api-core";
import { setSocketBaseUrl } from "../services/socket";
import { adapterRegistry } from "../adapters/adapter-registry";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** localStorage key for persisting the active environment selection. */
const STORAGE_KEY_ACTIVE_ENVIRONMENT = "active_environment_id";

// ---------------------------------------------------------------------------
// Static capability manifest
// ---------------------------------------------------------------------------

/**
 * All 19 capability flags from the canonical model. Every known dashboard
 * capability is listed here so it can be referenced by the static manifests.
 */
const ALL_CAPABILITIES: CapabilityFlag[] = [
    "canViewStatus",
    "canViewHealth",
    "canViewLogs",
    "canStreamLogs",
    "canRestart",
    "canStop",
    "canStart",
    "canEditConfig",
    "canViewConfig",
    "canBackup",
    "canRestore",
    "canRcon",
    "canProvision",
    "canUpdateMods",
    "canViewMetrics",
    "canViewUsers",
    "canManageUsers",
    "canDeploy",
    "canRollback",
];

/**
 * Static capability manifest for the `asa-control-api` backend type.
 *
 * The ASA Control API supports all 19 capability flags listed in the
 * canonical model. This manifest is used when the backend does not
 * expose a dynamic discovery endpoint.
 */
export const ASA_CONTROL_API_MANIFEST: CapabilityManifest = {
    backendId: "asa-control-api",
    capabilities: [...ALL_CAPABILITIES],
    version: 1,
    generatedAt: Date.now(),
};

/**
 * Static capability lookup table keyed by backend type.
 *
 * Maps each known backend type to a static list of capability flags.
 * Backend types without an entry in this table resolve to an empty
 * array (no capabilities), which means the dashboard renders in
 * read-only or deep-link-only mode.
 */
const DEFAULT_CAPABILITY_MAP: Record<string, CapabilityFlag[]> = {
    "asa-control-api": ALL_CAPABILITIES,
};

// ---------------------------------------------------------------------------
// Context types
// ---------------------------------------------------------------------------

/**
 * Shape of the EnvironmentContext value.
 */
export interface EnvironmentContextType {
    /** All configured environments available for selection. */
    availableEnvironments: EnvironmentConfig[];

    /** The currently active environment. */
    currentEnvironment: EnvironmentConfig;

    /**
     * Switch to a different environment by its canonical ID.
     *
     * Persists the selection to `localStorage` and resets per-backend
     * connection states to `'unknown'` for the new environment.
     *
     * @param envId - Canonical environment ID, e.g. `"env:asa-remote"`
     */
    setCurrentEnvironment: (envId: string) => void;

    /**
     * Return the connection state for a given backend ID within the current
     * environment.
     *
     * @param backendId - Backend identifier to look up
     * @returns The connection state, or `'unknown'` if the backend does not
     *          exist in the current environment
     */
    getBackendConnectionState: (backendId: string) => ConnectionState;

    /**
     * Return the first backend binding from the current environment.
     *
     * @returns The primary backend, or `undefined` if the environment has
     *          no backends configured (deep-link-only mode)
     */
    getPrimaryBackend: () => BackendBinding | undefined;

    /**
     * Resolve capabilities for the given environment (defaults to the
     * current environment).
     *
     * Combines capability manifests from all backends in the target
     * environment into a single `EnvironmentCapabilities` object. The
     * `combined` set is the union of all per-backend capabilities.
     *
     * @param envId - Optional environment ID; defaults to the current
     *                environment
     * @returns The combined environment capabilities
     */
    getCapabilities: (envId?: string) => EnvironmentCapabilities;

    /**
     * Check whether a specific capability flag is supported in the given
     * environment (defaults to the current environment).
     *
     * @param flag  - The capability flag to check
     * @param envId - Optional environment ID; defaults to the current
     *                environment
     * @returns `true` if any backend in the target environment supports
     *          the flag
     */
    supportsCapability: (flag: CapabilityFlag, envId?: string) => boolean;

    /**
     * Compatibility helper that returns the base URL of the primary backend
     * in the current environment.
     *
     * Used by `api-core.ts` and `socket.ts` during the migration from
     * single-backend to multi-environment mode. Returns an empty string
     * when the environment has no backends.
     *
     * @returns The primary backend base URL, or an empty string
     */
    getActiveBaseUrl: () => string;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const EnvironmentContext = createContext<EnvironmentContextType | null>(null);

// ---------------------------------------------------------------------------
// Provider props
// ---------------------------------------------------------------------------

interface EnvironmentProviderProps {
    children: ReactNode;
}

// ---------------------------------------------------------------------------
// Provider component
// ---------------------------------------------------------------------------

/**
 * Provides environment state and capability resolution to the component tree.
 *
 * On mount, the provider:
 * 1. Loads environments from the static configuration.
 * 2. Checks `localStorage` for a persisted environment ID.
 * 3. Falls back to the environment marked `isDefault` in the config.
 * 4. Initialises per-backend connection states to `'unknown'`.
 *
 * When the user switches environments, the provider persists the new ID
 * to `localStorage` and resets connection states for the new environment's
 * backends.
 */
export const EnvironmentProvider: React.FC<EnvironmentProviderProps> = ({
    children,
}) => {
    // Deep-clone environments so we can safely mutate per-backend
    // connectionState without affecting the static config.
    const [environments] = useState<EnvironmentConfig[]>(() =>
        staticEnvironments.map((env) => ({
            ...env,
            backends: env.backends.map((b) => ({ ...b })),
        })),
    );

    // Initialise the current environment from localStorage or the default.
    const [currentEnvironment, setCurrentEnvironmentState] =
        useState<EnvironmentConfig>(() => {
            const persisted = localStorage.getItem(
                STORAGE_KEY_ACTIVE_ENVIRONMENT,
            );
            if (persisted) {
                const found = getEnvironmentById(persisted);
                if (found) {
                    return {
                        ...found,
                        backends: found.backends.map((b) => ({ ...b })),
                    };
                }
            }
            const def = getDefaultEnvironment();
            return {
                ...def,
                backends: def.backends.map((b) => ({ ...b })),
            };
        });

    // Per-backend connection states keyed by backendId.
    const [connectionStates, setConnectionStates] = useState<
        Record<string, ConnectionState>
    >(() => {
        const states: Record<string, ConnectionState> = {};
        for (const backend of currentEnvironment.backends) {
            states[backend.backendId] = backend.connectionState;
        }
        return states;
    });

    /**
     * Switch to a different environment by its canonical environmentId.
     *
     * @param envId - The canonical environment ID, e.g. `"env:asa-remote"`
     */
    const setCurrentEnvironment = useCallback((envId: string) => {
        const env = getEnvironmentById(envId);
        if (!env) {
            console.warn(
                `[EnvironmentContext] Unknown environment "${envId}"; switch ignored.`,
            );
            return;
        }

        // Clone to avoid mutating the static config.
        const cloned: EnvironmentConfig = {
            ...env,
            backends: env.backends.map((b) => ({ ...b })),
        };

        // Reset connection states for the new environment.
        const newStates: Record<string, ConnectionState> = {};
        for (const backend of cloned.backends) {
            newStates[backend.backendId] = "unknown";
        }

        setConnectionStates(newStates);
        setCurrentEnvironmentState(cloned);

        // ---- Adapter lifecycle: tear down old, set up new ----

        // 1. Unregister all previously registered adapters (calls destroy() on each).
        const currentBackendId = adapterRegistry.getCurrentBackendId();
        if (currentBackendId) {
            adapterRegistry.unregister(currentBackendId);
        }

        // 2. Create and register adapters for each backend in the new environment.
        for (const backend of cloned.backends) {
            const adapter = adapterRegistry.resolveAdapter(backend, envId);

            // 3. Connect each adapter (validates connectivity / health check).
            adapter.connect().then(() => {
                // Update the connection state after the async connect attempt.
                setConnectionStates((prev) => ({
                    ...prev,
                    [backend.backendId]: adapter.getConnectionState(),
                }));
            });
        }

        // 4. Set the primary backend as current in the registry.
        if (cloned.backends.length > 0) {
            adapterRegistry.setCurrent(cloned.backends[0].backendId);
        }

        // Update the API base URL for legacy code paths.
        const primaryUrl = cloned.backends[0]?.baseUrl;
        if (primaryUrl) {
            setEnvironmentBaseUrl(primaryUrl);
            setSocketBaseUrl(primaryUrl);
        }

        // Persist the selection.
        try {
            localStorage.setItem(STORAGE_KEY_ACTIVE_ENVIRONMENT, envId);
        } catch {
            // localStorage may be unavailable (private browsing, quota limits).
        }
    }, []);

    /**
     * Return the connection state for a given backend ID.
     *
     * @param backendId - Backend identifier to look up
     */
    const getBackendConnectionState = useCallback(
        (backendId: string): ConnectionState =>
            connectionStates[backendId] ?? "unknown",
        [connectionStates],
    );

    /**
     * Return the first backend binding from the current environment.
     */
    const getPrimaryBackend = useCallback(
        (): BackendBinding | undefined => currentEnvironment.backends[0],
        [currentEnvironment],
    );

    /**
     * Resolve capabilities for a given environment.
     *
     * Combines static capability manifests from all backends in the target
     * environment into a single `EnvironmentCapabilities`. Unknown backend
     * types receive an empty capability set.
     *
     * @param envId - Optional environment ID; defaults to the current environment
     */
    const getCapabilities = useCallback(
        (envId?: string): EnvironmentCapabilities => {
            const targetEnvId = envId ?? currentEnvironment.environmentId;

            const targetEnv =
                targetEnvId === currentEnvironment.environmentId
                    ? currentEnvironment
                    : getEnvironmentById(targetEnvId);

            if (!targetEnv) {
                return {
                    environmentId: targetEnvId,
                    backendCapabilities: {},
                    combined: new Set<CapabilityFlag>(),
                };
            }

            const backendCapabilities: Record<string, CapabilityManifest> = {};
            const combinedSet = new Set<CapabilityFlag>();

            for (const backend of targetEnv.backends) {
                const flags = DEFAULT_CAPABILITY_MAP[backend.type] ?? [];

                backendCapabilities[backend.backendId] = {
                    backendId: backend.backendId,
                    capabilities: [...flags],
                    version: 1,
                    generatedAt: Date.now(),
                };

                for (const flag of flags) {
                    combinedSet.add(flag);
                }
            }

            return {
                environmentId: targetEnvId,
                backendCapabilities,
                combined: combinedSet,
            };
        },
        [currentEnvironment],
    );

    /**
     * Check whether a capability flag is supported in the given environment.
     *
     * @param flag  - The capability flag to check
     * @param envId - Optional environment ID; defaults to the current environment
     */
    const supportsCapability = useCallback(
        (flag: CapabilityFlag, envId?: string): boolean => {
            const caps = getCapabilities(envId);
            return caps.combined.has(flag);
        },
        [getCapabilities],
    );

    /**
     * Compatibility helper returning the primary backend's base URL.
     *
     * @returns The primary backend base URL, or an empty string
     */
    const getActiveBaseUrl = useCallback(
        (): string => currentEnvironment.backends[0]?.baseUrl ?? "",
        [currentEnvironment],
    );

    // Merge live connection states into the current environment so consumers
    // always see the latest state.
    const environmentWithLiveStates: EnvironmentConfig = useMemo(
        () => ({
            ...currentEnvironment,
            backends: currentEnvironment.backends.map((b) => ({
                ...b,
                connectionState:
                    connectionStates[b.backendId] ?? b.connectionState,
            })),
        }),
        [currentEnvironment, connectionStates],
    );

    const value: EnvironmentContextType = useMemo(
        () => ({
            availableEnvironments: environments,
            currentEnvironment: environmentWithLiveStates,
            setCurrentEnvironment,
            getBackendConnectionState,
            getPrimaryBackend,
            getCapabilities,
            supportsCapability,
            getActiveBaseUrl,
        }),
        [
            environments,
            environmentWithLiveStates,
            setCurrentEnvironment,
            getBackendConnectionState,
            getPrimaryBackend,
            getCapabilities,
            supportsCapability,
            getActiveBaseUrl,
        ],
    );

    return (
        <EnvironmentContext.Provider value={value}>
            {children}
        </EnvironmentContext.Provider>
    );
};

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Access the current environment context.
 *
 * Must be called within an `EnvironmentProvider`. Throws an error if no
 * provider is found in the component tree.
 *
 * @returns The {@link EnvironmentContextType} value
 */
export const useEnvironment = (): EnvironmentContextType => {
    const context = useContext(EnvironmentContext);
    if (context === null) {
        throw new Error(
            "useEnvironment must be used within an EnvironmentProvider",
        );
    }
    return context;
};
