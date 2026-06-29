/**
 * ASAAdapter
 *
 * This file is a re-export from the asa-adapter/ directory.
 * The module has been refactored into smaller focused modules.
 */
export { ASAAdapter } from './asa-adapter/asa-adapter';
export { normalizeStatus, normalizeError } from './asa-adapter/utils';
export { CONTAINER_ACTIONS } from './asa-adapter/actions';

  // -----------------------------------------------------------------------
  // Cleanup
  // -----------------------------------------------------------------------

  /** @inheritdoc */
  destroy(): void {
    if (this._authExpiryTimer) {
      clearTimeout(this._authExpiryTimer);
      this._authExpiryTimer = null;
    }
    this._expiredCallbacks = [];
    this._authToken = null;
    this._connectionState = "disconnected";
  }

  // -----------------------------------------------------------------------
  // Private helpers
  // -----------------------------------------------------------------------

  /**
   * Transform a raw container or native-server object into a canonical
   * ServiceEntry.
   */
  private _toServiceEntry(
    raw: Record<string, unknown>,
    sourceType: "container" | "native-server",
  ): ServiceEntry {
    const name = String(raw.name ?? raw.serverName ?? "unknown");

    return {
      serviceId: `${this.backendId}:${name}`,
      environmentId: this._environmentId,
      name,
      kind: "game-server",
      runtimeOwner: sourceType === "container" ? "compose" : "manual",
      lifecycleState: "active",
      ports: [],
      status: normalizeStatus(raw.status as string | boolean | undefined),
      health: "unknown",
      backendId: this.backendId,
      backendResourceId: name,
      tags: [sourceType],
      extensions: { ...raw, _sourceType: sourceType },
    };
  }

  /**
   * Parse the JWT expiry and schedule auth-expired notification.
   */
  private _setupExpiryFromToken(token: string): void {
    try {
      const payload = token.split(".")[1];
      if (!payload) return;
      const decoded = JSON.parse(atob(payload));
      if (decoded.exp) {
        const expiresIn = decoded.exp * 1000 - Date.now();
        if (expiresIn > 0) {
          this._authExpiryTimer = setTimeout(() => {
            this._authToken = null;
            localStorage.removeItem("auth_token");
            this._notifyAuthExpired();
          }, expiresIn);
        }
      }
    } catch {
      // Not a JWT or can't parse — ignore.
    }
  }

  /**
   * Notify all registered auth-expired callbacks.
   */
  private _notifyAuthExpired(): void {
    for (const cb of this._expiredCallbacks) {
      try {
        cb();
      } catch {
        // Swallow callback errors to prevent one bad callback from
        // breaking the rest.
      }
    }
  }
}
