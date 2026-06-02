/**
 * Static Capability Manifests
 *
 * For backends that cannot expose a dynamic discovery endpoint, the
 * capability manifest is defined statically alongside the environment
 * config. These manifests tell the dashboard what actions are available
 * for each backend type.
 *
 * @see /home/steam/automation/docs/plans/phase6-backend-adapter-design.md
 */

import type { CapabilityFlag, CapabilityManifest } from '../types/capabilities';

// ---------------------------------------------------------------------------
// ASA Control API
// ---------------------------------------------------------------------------

/**
 * All 19 capability flags from the canonical model, used as the baseline
 * for the ASA control API backend.
 */
export const ASA_ALL_CAPABILITIES: CapabilityFlag[] = [
  'canViewStatus',
  'canViewHealth',
  'canViewLogs',
  'canStreamLogs',
  'canRestart',
  'canStop',
  'canStart',
  'canEditConfig',
  'canViewConfig',
  'canBackup',
  'canRestore',
  'canRcon',
  'canProvision',
  'canUpdateMods',
  'canViewMetrics',
  'canViewUsers',
  'canManageUsers',
  'canDeploy',
  'canRollback',
];

/**
 * Static capability manifest for the `asa-control-api` backend type.
 *
 * The ASA Control API supports all 19 capability flags listed in the
 * canonical model. This manifest is used when the backend does not
 * expose a dynamic discovery endpoint.
 */
export const ASA_CONTROL_API_MANIFEST: CapabilityManifest = {
  backendId: 'asa-control-api',
  capabilities: [...ASA_ALL_CAPABILITIES],
  version: 1,
  generatedAt: Date.now(),
};

// ---------------------------------------------------------------------------
// Deployctl
// ---------------------------------------------------------------------------

/**
 * Capability flags supported by the deployctl backend.
 *
 * Deployctl is a lightweight local tool that supports basic lifecycle
 * operations but does not expose advanced features like mod management
 * or RCON.
 */
export const DEPLOYCTL_CAPABILITIES: CapabilityFlag[] = [
  'canViewStatus',
  'canViewHealth',
  'canViewLogs',
  'canRestart',
  'canDeploy',
  'canRollback',
];

/**
 * Static capability manifest for the `deployctl` backend type.
 */
export const DEPLOYCTL_MANIFEST: CapabilityManifest = {
  backendId: 'deployctl',
  capabilities: [...DEPLOYCTL_CAPABILITIES],
  version: 1,
  generatedAt: Date.now(),
};

// ---------------------------------------------------------------------------
// Lookup
// ---------------------------------------------------------------------------

/**
 * Static capability lookup table keyed by backend type.
 *
 * Maps each known backend type to a static capability manifest.
 * Backend types without an entry in this table resolve to an empty
 * manifest (zero capabilities), which means the dashboard renders in
 * read-only or deep-link-only mode.
 */
export const staticCapabilityManifests: Record<string, CapabilityManifest> = {
  'asa-control-api': ASA_CONTROL_API_MANIFEST,
  deployctl: DEPLOYCTL_MANIFEST,
};
