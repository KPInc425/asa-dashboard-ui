/**
 * Adapters Barrel Export
 *
 * @see /home/steam/automation/docs/plans/phase6-backend-adapter-design.md
 */

export { adapterRegistry, AdapterRegistry } from './adapter-registry';
export { ASAAdapter } from './asa-adapter';
export { NoOpAdapter } from './noop-adapter';
export { DeployctlAdapter } from './deployctl-adapter';
export {
  staticCapabilityManifests,
  ASA_CONTROL_API_MANIFEST,
  DEPLOYCTL_MANIFEST,
  ASA_ALL_CAPABILITIES,
  DEPLOYCTL_CAPABILITIES,
} from './capabilities';

export type {
  BackendAdapter,
  AuthCredentials,
  AuthResult,
  ActionResult,
  CanonicalError,
  HealthStatusData,
  LogEntry,
  LogOptions,
  ServiceStatusData,
  TypedAction,
} from './types';
