/**
 * Adapter Registry
 *
 * Manages adapter instances keyed by backend ID. Provides a singleton
 * registry that the EnvironmentContext uses to register and unregister
 * adapters on environment switch, and that hooks use to look up the
 * current adapter.
 *
 * @see /home/steam/automation/docs/plans/phase6-backend-adapter-design.md
 */

import type { BackendBinding } from "../types/environment";
import type { BackendAdapter } from "./types";
import { ASAAdapter } from "./asa-adapter";
import { DeployctlAdapter } from "./deployctl-adapter";
import { NoOpAdapter } from "./noop-adapter";

/**
 * Registry of BackendAdapter instances keyed by backend ID.
 *
 * Usage:
 * ```typescript
 * import { adapterRegistry } from '../adapters/adapter-registry';
 *
 * const adapter = adapterRegistry.get('asa-control-api');
 * const services = await adapter?.listServices();
 * ```
 */
export class AdapterRegistry {
    private adapters: Map<string, BackendAdapter> = new Map();
    private currentBackendId: string | null = null;

    /**
     * Register an adapter instance for a specific backend binding.
     *
     * If an adapter with the same backendId is already registered, it is
     * destroyed and replaced.
     *
     * @param backendId - The backend identifier (matches BackendBinding.backendId)
     * @param adapter   - The adapter instance to register
     */
    register(backendId: string, adapter: BackendAdapter): void {
        // Destroy existing adapter if one exists.
        const existing = this.adapters.get(backendId);
        if (existing) {
            existing.destroy();
        }

        this.adapters.set(backendId, adapter);
    }

    /**
     * Get the adapter for a specific backend.
     *
     * @param backendId - The backend identifier to look up
     * @returns The adapter instance, or undefined if not registered
     */
    get(backendId: string): BackendAdapter | undefined {
        return this.adapters.get(backendId);
    }

    /**
     * Set the "current" backend ID and return its adapter.
     *
     * @param backendId - The backend to make current
     * @returns The current adapter, or undefined
     */
    setCurrent(backendId: string): BackendAdapter | undefined {
        this.currentBackendId = backendId;
        return this.get(backendId);
    }

    /**
     * Get the adapter for the current primary backend.
     *
     * The current backend is set by `setCurrent()` or by `resolveAdapter()`.
     *
     * @returns The current adapter, or undefined if no current backend is set
     */
    getCurrentAdapter(): BackendAdapter | undefined {
        if (this.currentBackendId) {
            return this.get(this.currentBackendId);
        }
        return undefined;
    }

    /**
     * Get the current backend ID.
     */
    getCurrentBackendId(): string | null {
        return this.currentBackendId;
    }

    /**
     * Unregister and destroy an adapter.
     *
     * @param backendId - The backend identifier to unregister
     */
    unregister(backendId: string): void {
        const adapter = this.adapters.get(backendId);
        if (adapter) {
            adapter.destroy();
            this.adapters.delete(backendId);
        }

        if (this.currentBackendId === backendId) {
            this.currentBackendId = null;
        }
    }

    /**
     * Resolve a BackendBinding into the appropriate adapter type and
     * register it.
     *
     * Factory method that creates the correct adapter class based on
     * the binding's `type` field.
     *
     * @param binding - The backend binding configuration
     * @param environmentId - Optional environment ID for adapters that need it
     * @returns A new adapter instance (already registered)
     */
    resolveAdapter(
        binding: BackendBinding,
        environmentId?: string,
    ): BackendAdapter {
        let adapter: BackendAdapter;

        switch (binding.type) {
            case "asa-control-api":
                adapter = new ASAAdapter(binding, environmentId);
                break;
            case "deployctl":
                adapter = new DeployctlAdapter(binding);
                break;
            default:
                // Unknown or 'generic' backends use the NoOpAdapter.
                adapter = new NoOpAdapter(binding);
                break;
        }

        this.register(binding.backendId, adapter);
        return adapter;
    }
}

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

/**
 * The global singleton adapter registry.
 *
 * Import this from anywhere in the application to access the current
 * adapter.
 */
export const adapterRegistry = new AdapterRegistry();
