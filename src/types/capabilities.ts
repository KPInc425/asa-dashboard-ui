/**
 * Capability Types
 *
 * Capability flags from the Phase 1 canonical model and Phase 5 design doc.
 * Capabilities tell the dashboard what actions it can offer in the current
 * environment. They are the intersection of what the backend supports and
 * what the local inventory configures.
 *
 * @see /home/steam/automation/docs/plans/phase5-dashboard-shell-design.md
 * @see /home/steam/automation/docs/plans/phase1-canonical-model.md
 */

// ---------------------------------------------------------------------------
// Capability flags
// ---------------------------------------------------------------------------

/**
 * Capability flags that determine which UI features are visible in the
 * current environment.
 *
 * Each flag represents an action the dashboard can offer for a given
 * service or backend. Features are conditionally rendered based on
 * whether the corresponding capability is present.
 *
 * - `canViewStatus`: Can read the service's runtime status
 * - `canViewHealth`: Can read the service's health assessment
 * - `canViewLogs`: Can read or access the service's logs
 * - `canStreamLogs`: Can stream logs in real-time (e.g. via Socket.IO)
 * - `canRestart`: Can restart the service
 * - `canStop`: Can stop the service
 * - `canStart`: Can start the service
 * - `canEditConfig`: Can view and modify the service's configuration
 * - `canViewConfig`: Can view the service's configuration (read-only)
 * - `canBackup`: Can trigger or view backup status
 * - `canRestore`: Can restore from a backup
 * - `canRcon`: Can send RCON commands to the service
 * - `canProvision`: Can create a new instance of this service type
 * - `canUpdateMods`: Can manage mods for this service
 * - `canViewMetrics`: Can read resource usage (CPU, memory, disk)
 * - `canViewUsers`: Can view the user/player list
 * - `canManageUsers`: Can manage users (add, remove, ban)
 * - `canDeploy`: Can deploy new versions of the service
 * - `canRollback`: Can rollback to a previous version
 */
export type CapabilityFlag =
  | 'canViewStatus'
  | 'canViewHealth'
  | 'canViewLogs'
  | 'canStreamLogs'
  | 'canRestart'
  | 'canStop'
  | 'canStart'
  | 'canEditConfig'
  | 'canViewConfig'
  | 'canBackup'
  | 'canRestore'
  | 'canRcon'
  | 'canProvision'
  | 'canUpdateMods'
  | 'canViewMetrics'
  | 'canViewUsers'
  | 'canManageUsers'
  | 'canDeploy'
  | 'canRollback';

// ---------------------------------------------------------------------------
// Capability manifest
// ---------------------------------------------------------------------------

/**
 * A versioned capability manifest for a single backend.
 *
 * Manifests can be obtained either through dynamic discovery (the backend
 * exposes a capabilities endpoint) or through a static configuration.
 * The version field allows the frontend to detect stale manifests and
 * re-fetch when necessary.
 */
export interface CapabilityManifest {
  /** Backend ID this manifest applies to */
  backendId: string;
  /** List of capabilities this backend supports */
  capabilities: CapabilityFlag[];
  /** Manifest version — incremented when capabilities change */
  version: number;
  /** Timestamp (epoch ms) when this manifest was generated */
  generatedAt?: number;
}

// ---------------------------------------------------------------------------
// Environment capabilities
// ---------------------------------------------------------------------------

/**
 * Per-environment capability resolution.
 *
 * Each backend in an environment may contribute a set of capabilities.
 * The `combined` set is the union of all backends' capabilities,
 * representing what the environment can do as a whole.
 */
export interface EnvironmentCapabilities {
  /** Environment ID these capabilities apply to */
  environmentId: string;
  /** Capability manifests keyed by backend ID */
  backendCapabilities: Record<string, CapabilityManifest>;
  /** Union of all backends' capabilities for this environment */
  combined: Set<CapabilityFlag>;
}
