/**
 * Inventory Types
 *
 * Canonical service and node entity types from the Phase 1 model. These types
 * describe the services tracked by the dashboard inventory — game servers,
 * daemons, web apps, and host jobs — along with their runtime, health,
 * observability, and control metadata.
 *
 * Used by the inventory-driven pages introduced in later phases.
 *
 * @see /home/steam/automation/docs/plans/phase5-dashboard-shell-design.md
 * @see /home/steam/automation/docs/plans/phase1-canonical-model.md
 */

// ---------------------------------------------------------------------------
// Vocabularies
// ---------------------------------------------------------------------------

/**
 * The category of a service — what kind of thing it is.
 *
 * - `app`: A Docker Compose–managed web application (e.g. Affine, Keycloak)
 * - `game-server`: A dedicated game server process (e.g. Minecraft, ASA)
 * - `daemon`: A long-running host daemon (e.g. Discord bot, DDNS script)
 * - `host-job`: A scheduled task (systemd timer, cron)
 */
export type ServiceKind = 'app' | 'game-server' | 'daemon' | 'host-job';

/**
 * Who manages the lifecycle of a service.
 *
 * - `compose`: Managed by Docker Compose via deployctl
 * - `systemd`: Managed by a systemd unit (user or system)
 * - `screen`: Managed via a GNU screen session
 * - `txadmin`: Managed by txAdmin (FiveM-specific)
 * - `manual`: Started and stopped by ad hoc scripts with no formal owner
 * - `unknown`: Runtime owner cannot be determined
 */
export type RuntimeOwner =
  | 'compose'
  | 'systemd'
  | 'screen'
  | 'txadmin'
  | 'manual'
  | 'unknown';

/**
 * Whether a service is expected to be running (lifecycle intent), not whether
 * it is currently running.
 *
 * - `active`: Expected to be running continuously
 * - `on-demand`: Started and stopped intermittently by operators
 * - `dormant`: Not expected to run but not removed from the host
 * - `archived`: Removed from the host but kept in inventory for reference
 * - `legacy`: No longer actively managed, kept for historical reference
 */
export type LifecycleState =
  | 'active'
  | 'on-demand'
  | 'dormant'
  | 'archived'
  | 'legacy';

/**
 * The current runtime status of a service — whether the process is up or down.
 *
 * - `running`: Process is up and serving
 * - `stopped`: Process is down, intentionally
 * - `degraded`: Process is up but reporting problems
 * - `updating`: Process is in the middle of an update
 * - `unknown`: Status cannot be determined
 */
export type ServiceStatus = 'running' | 'stopped' | 'degraded' | 'updating' | 'unknown';

/**
 * Health assessment of a service — whether it is performing correctly,
 * independent of whether it is running.
 *
 * - `healthy`: Health checks are passing
 * - `warning`: Some health checks are failing or stale
 * - `unhealthy`: Health checks are failing
 * - `unknown`: No health check data available
 */
export type HealthStatus = 'healthy' | 'warning' | 'unhealthy' | 'unknown';

// ---------------------------------------------------------------------------
// Port mapping
// ---------------------------------------------------------------------------

/**
 * A network port exposed by a service.
 *
 * Derived from the Phase 1 PortMapping entity. The `port` field corresponds
 * to the `number` field in the canonical model.
 */
export interface PortMapping {
  /** Port number (e.g. 7777, 27015) */
  port: number;
  /** Transport protocol — defaults to tcp if not specified */
  protocol: 'tcp' | 'udp';
  /** Optional IP address to bind to */
  bindAddress?: string;
}

// ---------------------------------------------------------------------------
// Service identity
// ---------------------------------------------------------------------------

/**
 * The canonical identity of a service.
 *
 * A service is uniquely identified by the triple of its canonical compound ID,
 * its environment, and its backend-native local ID. The serviceId follows the
 * format `svc:<environmentId>:<localId>` (e.g. `svc:ilgaming-prod:minecraft-paper`).
 */
export interface ServiceIdentity {
  /** Canonical compound service ID, e.g. "svc:ilgaming-prod:minecraft-paper" */
  serviceId: string;
  /** Environment this service belongs to */
  environmentId: string;
  /** Backend-native identifier, unnormalized */
  localId: string;
}

// ---------------------------------------------------------------------------
// Service entry
// ---------------------------------------------------------------------------

/**
 * A health source describes where the service's health data originates.
 */
export interface HealthSource {
  type: 'uptime-kuma' | 'backend' | 'manual';
  url?: string;
}

/**
 * A log source describes where the service's logs can be found.
 */
export interface LogSource {
  type: 'dozzle' | 'file' | 'backend' | 'journal';
  url?: string;
  path?: string;
}

/**
 * A backup policy describes how a service's data is backed up.
 */
export interface BackupPolicy {
  enabled: boolean;
  schedule?: string;
  type?: string;
}

/**
 * A full service entry in the dashboard inventory.
 *
 * ServiceEntry represents a canonical service entity that the dashboard
 * tracks — a game server, daemon, web application, or host job. It carries
 * identity, runtime state, health, observability links, control metadata,
 * and backend-specific extensions.
 */
export interface ServiceEntry {
  // Identity (canonical)
  /** Canonical compound service ID */
  serviceId: string;
  /** Environment this service belongs to */
  environmentId: string;

  // Metadata
  /** Human-readable name */
  name: string;
  /** Category of service */
  kind: ServiceKind;
  /** Who manages the service lifecycle */
  runtimeOwner: RuntimeOwner;
  /** Whether the service is expected to be running */
  lifecycleState: LifecycleState;

  // Runtime
  /** Primary filesystem path on the host */
  primaryPath?: string;
  /** Network ports the service exposes */
  ports: PortMapping[];
  /** Current runtime status */
  status: ServiceStatus;
  /** Current health assessment */
  health: HealthStatus;

  // Observability links
  /** Source of health data */
  healthSource?: HealthSource;
  /** Where to find this service's logs */
  logSource?: LogSource;
  /** Link to a custom dashboard for this service */
  dashboardUrl?: string;

  // Control
  /** Backend that manages this service */
  backendId?: string;
  /** Resource identifier within the backend */
  backendResourceId?: string;
  /** Commands this service supports (e.g. "restart", "backup") */
  supportedCommands?: string[];

  // Platform
  /** Backup configuration */
  backupPolicy?: BackupPolicy;
  /** Link to operational documentation */
  runbookUrl?: string;
  /** Operator annotations for grouping/filtering */
  tags: string[];

  // Backend-specific data preserved unnormalized
  /** Arbitrary backend-specific metadata */
  extensions?: Record<string, unknown>;
}
