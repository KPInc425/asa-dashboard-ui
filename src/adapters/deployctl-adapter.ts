/**
 * Deployctl Adapter (Stub)
 *
 * A future adapter that wraps the deployctl.sh tool on the local host or
 * via SSH. Not yet implemented — this file exists as a reference for the
 * method mappings and will be implemented in a later phase.
 *
 * @see /home/steam/automation/docs/plans/phase6-backend-adapter-design.md
 */

import { NoOpAdapter } from './noop-adapter';
import type { BackendBinding } from '../types/environment';

/**
 * Adapter for the deployctl local backend.
 *
 * Deployctl manages applications defined in apps/*.conf files on the
 * local host. This adapter wraps shell calls to deployctl.sh.
 *
 * ## Method Mappings (Future)
 *
 * | Adapter Method       | deployctl Execution              |
 * |----------------------|----------------------------------|
 * | `listServices()`     | `deployctl.sh list`              |
 * | `getServiceStatus()` | `deployctl.sh status APP_ID`     |
 * | `executeAction()`    | `deployctl.sh restart APP_ID`    |
 * | `discoverCapabilities()` | Static manifest (restart, status, health only) |
 *
 * @deferred Implementation deferred until local backend hosting is confirmed.
 */
export class DeployctlAdapter extends NoOpAdapter {
  constructor(binding: BackendBinding) {
    super(binding);

    // Override the default 'unknown' type with 'deployctl'.
    Object.defineProperty(this, 'backendType', {
      value: 'deployctl' as const,
      writable: false,
    });
  }
}
